import { isAbsolute, relative, resolve } from 'node:path';
import type { DocEntry, GeneratedDoc } from 'fumadocs-typescript';
import type { PropDeclaration, PropSymbol, SyntaxNode } from './component-prop-analysis.js';
import type { TypeDefinition, TypeDefinitionsPayload } from './type-definition-model.js';
import { encodeTypeDefinitions, TYPE_DEFINITIONS_KEY } from './type-definition-model.js';

const KIND_LABELS = new Set(['union', 'object', 'intersection', 'tuple', 'array', 'function']);

interface EnrichContext {
	definitions: TypeDefinitionsPayload;
	propsByName: Map<string, PropSymbol>;
	reactSrcDir: string;
	repoRoot: string;
}

/**
 * Restores declared aliases for optional props, records whether `| undefined` is explicit in the
 * annotation, and collects source-backed definitions for linkable Luke UI type aliases.
 */
export function enrichGeneratedDocTypes(
	doc: GeneratedDoc,
	propsDeclaration: PropDeclaration | undefined,
	reactSrcDir: string,
	repoRoot: string,
): GeneratedDoc {
	const definitions: TypeDefinitionsPayload = {};
	const propsByName = propsDeclaration === undefined ? new Map() : propsByNameMap(propsDeclaration);
	const context: EnrichContext = {
		definitions,
		propsByName,
		reactSrcDir: resolve(reactSrcDir),
		repoRoot: resolve(repoRoot),
	};

	const entries = doc.entries.flatMap((entry) => {
		if (entry.name === TYPE_DEFINITIONS_KEY) return [];
		return [enrichDocEntry(entry, context)];
	});

	if (Object.keys(definitions).length > 0) {
		entries.push(typeDefinitionsEntry(definitions));
	}

	return { ...doc, entries };
}

function enrichDocEntry(entry: DocEntry, context: EnrichContext): DocEntry {
	const prop = context.propsByName.get(entry.name);
	const declarations = prop?.getDeclarations() ?? [];
	const typeNode = firstTypeNode(declarations);
	const declaredText = typeNode?.getText().trim();

	let type = entry.type;
	let simplifiedType = entry.simplifiedType;
	let typeHref = entry.typeHref;

	if (declaredText !== undefined && declaredText.length > 0) {
		// The property's written annotation is the public contract. It never includes the compiler's
		// implied optional `| undefined`, and it keeps aliases that fumadocs' simplifiedType drops.
		type = declaredText;
		simplifiedType = declaredText;
	} else if (KIND_LABELS.has(simplifiedType) && entry.type.length > 0 && entry.type !== 'union') {
		// No annotation available: prefer the full type string over a bare kind label, but do not
		// strip `| undefined` — that would guess at optionality vs explicit undefined.
		simplifiedType = entry.type;
		type = entry.type;
	}

	const linkedName = collectLinkedDefinition(typeNode, context);
	if (linkedName !== undefined) {
		typeHref = linkedName;
	}

	if (
		type === entry.type &&
		simplifiedType === entry.simplifiedType &&
		typeHref === entry.typeHref
	) {
		return entry;
	}

	return {
		...entry,
		simplifiedType,
		type,
		...(typeHref === undefined ? {} : { typeHref }),
	};
}

function collectLinkedDefinition(
	typeNode: SyntaxNode | undefined,
	context: EnrichContext,
): string | undefined {
	const reference = rootTypeReference(typeNode);
	if (reference === undefined) return;

	const aliasDeclaration = resolveLukeTypeAlias(reference, context.reactSrcDir, context.repoRoot);
	if (aliasDeclaration === undefined) return;

	const name = aliasDeclaration.getName?.();
	if (name === undefined || name.length === 0) return;

	if (context.definitions[name] === undefined) {
		context.definitions[name] = definitionFromAlias(aliasDeclaration, context.repoRoot);
	}
	return name;
}

function definitionFromAlias(aliasDeclaration: SyntaxNode, repoRoot: string): TypeDefinition {
	const name = aliasDeclaration.getName?.() ?? 'Unknown';
	const filePath = aliasDeclaration.getSourceFile().getFilePath();
	const repoRelative = relative(repoRoot, filePath);
	return {
		definition: formatAliasDefinition(aliasDeclaration),
		filePath: repoRelative.startsWith('..') ? filePath : repoRelative,
		name,
	};
}

function formatAliasDefinition(aliasDeclaration: SyntaxNode): string {
	const text = aliasDeclaration.getText().trim();
	return text.startsWith('export ') ? text.slice('export '.length) : text;
}

function resolveLukeTypeAlias(
	reference: SyntaxNode,
	reactSrcDir: string,
	repoRoot: string,
): SyntaxNode | undefined {
	const typeNameNode = reference.getTypeName?.();
	const localName = typeNameNode?.getText();
	const symbol =
		typeNameNode?.getSymbol?.() ??
		reference.getSymbol?.() ??
		reference.getType?.().getAliasSymbol?.();

	const candidates: Array<SyntaxNode> = [];
	if (symbol !== undefined) {
		const aliased = symbol.getAliasedSymbol?.() ?? symbol;
		candidates.push(...aliased.getDeclarations());
	}
	// Same-file exports cover fixtures and local aliases when the checker symbol is unavailable.
	if (localName !== undefined && localName.length > 0) {
		const local = reference.getSourceFile().getExportedDeclarations().get(localName)?.[0];
		if (local !== undefined) candidates.push(local);
	}

	for (const declaration of candidates) {
		if (declaration.getKindName() !== 'TypeAliasDeclaration') continue;
		const filePath = declaration.getSourceFile().getFilePath();
		// Real package aliases and docs fixtures are linkable; node_modules stays plain text.
		if (filePath.includes('/node_modules/')) continue;
		if (
			isInsideDir(filePath, reactSrcDir) ||
			isInsideDir(filePath, resolve(repoRoot, 'apps/docs'))
		) {
			return declaration;
		}
	}
	return;
}

function isInsideDir(filePath: string, dir: string): boolean {
	const relativePath = relative(resolve(dir), resolve(filePath));
	return relativePath !== '' && !relativePath.startsWith('..') && !isAbsolute(relativePath);
}

function rootTypeReference(typeNode: SyntaxNode | undefined): SyntaxNode | undefined {
	if (typeNode === undefined) return;
	const kind = typeNode.getKindName();
	if (kind === 'TypeReference') return typeNode;
	if (kind === 'ParenthesizedType') return rootTypeReference(typeNode.getTypeNode?.());
	return;
}

/**
 * True when the written annotation's outermost union includes `undefined`. Nested
 * `Foo<string | undefined>` does not count — only a top-level constituent does.
 */
export function annotationIncludesTopLevelUndefined(typeNode: SyntaxNode | undefined): boolean {
	if (typeNode === undefined) return false;
	const kind = typeNode.getKindName();
	if (kind === 'UndefinedKeyword') return true;
	if (kind === 'ParenthesizedType') {
		return annotationIncludesTopLevelUndefined(typeNode.getTypeNode?.());
	}
	if (kind === 'UnionType') {
		return (typeNode.getTypeNodes?.() ?? []).some(
			(member) => member.getKindName() === 'UndefinedKeyword',
		);
	}
	return false;
}

function firstTypeNode(declarations: ReadonlyArray<SyntaxNode>): SyntaxNode | undefined {
	for (const declaration of declarations) {
		const typeNode = declaration.getTypeNode?.();
		if (typeNode !== undefined) return typeNode;
	}
	return;
}

function propsByNameMap(declaration: PropDeclaration): Map<string, PropSymbol> {
	const type = declaration.getType();
	const constituents = type.isUnion() ? type.getUnionTypes() : [type];
	const props = new Map<string, PropSymbol>();
	for (const constituent of constituents) {
		for (const prop of constituent.getProperties()) {
			if (!props.has(prop.getName())) props.set(prop.getName(), prop);
		}
	}
	return props;
}

function typeDefinitionsEntry(definitions: TypeDefinitionsPayload): DocEntry {
	return {
		deprecated: false,
		description: '',
		name: TYPE_DEFINITIONS_KEY,
		required: true,
		simplifiedType: '',
		tags: [],
		type: '',
		typeHref: encodeTypeDefinitions(definitions),
	};
}
