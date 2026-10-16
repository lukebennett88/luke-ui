import { isAbsolute, relative, resolve } from 'node:path';
import type { DocEntry, GeneratedDoc } from 'fumadocs-typescript';
import type { PropDeclaration, SyntaxNode } from './component-prop-analysis.js';
import type {
	EnrichedGeneratedDoc,
	TypeDefinition,
	TypeDefinitionsPayload,
} from './type-definition-model.js';

const KIND_LABELS = new Set(['union', 'object', 'intersection', 'tuple', 'array', 'function']);

interface EnrichContext {
	definitions: TypeDefinitionsPayload;
	/** Every written annotation for a prop across union branches, in encounter order. */
	annotationsByName: Map<string, ReadonlyArray<SyntaxNode>>;
	reactSrcDir: string;
	repoRoot: string;
}

/**
 * Restores declared aliases for optional props and collects source-backed definitions for linkable
 * Luke UI type aliases. Definitions hang on the doc as `typeDefinitions`, not as a fake prop entry.
 */
export function enrichGeneratedDocTypes(
	doc: GeneratedDoc,
	propsDeclaration: PropDeclaration | undefined,
	reactSrcDir: string,
	repoRoot: string,
): EnrichedGeneratedDoc {
	const definitions: TypeDefinitionsPayload = {};
	const annotationsByName =
		propsDeclaration === undefined
			? new Map<string, ReadonlyArray<SyntaxNode>>()
			: annotationsByPropName(propsDeclaration);
	const context: EnrichContext = {
		annotationsByName,
		definitions,
		reactSrcDir: resolve(reactSrcDir),
		repoRoot: resolve(repoRoot),
	};

	const entries = doc.entries.map((entry) => enrichDocEntry(entry, context));

	const enriched: EnrichedGeneratedDoc = { ...doc, entries };
	if (Object.keys(definitions).length > 0) {
		enriched.typeDefinitions = definitions;
	}
	return enriched;
}

function enrichDocEntry(entry: DocEntry, context: EnrichContext): DocEntry {
	const resolved = resolveDeclaredTypeAnnotations(context.annotationsByName.get(entry.name) ?? []);

	let type = entry.type;
	let simplifiedType = entry.simplifiedType;
	let typeHref = entry.typeHref;

	const useDeclaredAnnotation = shouldPreferDeclaredAnnotation(resolved);

	if (useDeclaredAnnotation && resolved.text !== undefined) {
		// Written annotations keep aliases fumadocs drops and never include compiler-implied optional
		// `| undefined`. Distinct valid branch annotations become a union.
		type = resolved.text;
		simplifiedType = resolved.text;
	} else if (
		(KIND_LABELS.has(simplifiedType) || resolved.text !== undefined) &&
		entry.type.length > 0 &&
		entry.type !== 'union'
	) {
		// Prefer the resolved signature over a bare kind label or a low-readability annotation such
		// as `RacButtonProps['onPress']`.
		type = displayResolvedType(entry, resolved.nodes);
		simplifiedType = type;
	}

	for (const typeNode of resolved.nodes) {
		collectLinkedDefinition(typeNode, context);
	}

	if (useDeclaredAnnotation) {
		if (resolved.singleLinkNode !== undefined) {
			const linkedName = collectLinkedDefinition(resolved.singleLinkNode, context);
			if (linkedName !== undefined) {
				typeHref = linkedName;
			}
		} else if (resolved.nodes.length > 1) {
			typeHref = undefined;
		}
	} else {
		typeHref = undefined;
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
		...(typeHref === undefined ? { typeHref: undefined } : { typeHref }),
	};
}

/**
 * Keep source annotations when they name a useful alias or otherwise read better than the resolved
 * type. Prefer fumadocs' resolved signature for indexed-access wrappers such as
 * `RacButtonProps['onPress']`.
 */
export function shouldPreferDeclaredAnnotation(resolved: ResolvedDeclaredTypeAnnotations): boolean {
	if (resolved.text === undefined || resolved.text.length === 0) return false;
	if (resolved.nodes.length === 0) return false;
	return !resolved.nodes.every(isLowReadabilityDeclaredType);
}

/** True for annotations that hide the real shape behind property lookup or similar opacity. */
export function isLowReadabilityDeclaredType(typeNode: SyntaxNode): boolean {
	const kind = typeNode.getKindName();
	if (kind === 'IndexedAccessType') return true;
	if (kind === 'ImportType' || kind === 'TypeQuery') return true;
	if (kind === 'ParenthesizedType') {
		const inner = typeNode.getTypeNode?.();
		return inner !== undefined && isLowReadabilityDeclaredType(inner);
	}
	if (kind === 'UnionType') {
		const members = typeNode.getTypeNodes?.() ?? [];
		return members.length > 0 && members.every(isLowReadabilityDeclaredType);
	}
	return false;
}

/**
 * Drop a trailing top-level `| undefined` only when it is compiler-implied optionality. When any
 * written annotation admits undefined — via syntax or the checker type of an indexed access — keep
 * it.
 */
function displayResolvedType(entry: DocEntry, annotationNodes: ReadonlyArray<SyntaxNode>): string {
	let display = entry.type;
	if (
		annotationNodes.length > 0 &&
		!entry.required &&
		!annotationNodes.some((node) => declaredTypeAdmitsUndefined(node))
	) {
		display = stripTrailingOptionalUndefined(display);
	}
	return display;
}

/** Drop a trailing top-level `| undefined` that TypeScript adds for optional props. */
export function stripTrailingOptionalUndefined(typeText: string): string {
	if (typeText.endsWith(' | undefined')) {
		return typeText.slice(0, -' | undefined'.length);
	}
	return typeText;
}

/**
 * True when the written annotation admits `undefined` as a value: either a top-level
 * `undefined` in the syntax, or a checker type that includes it (indexed access, aliases).
 */
export function declaredTypeAdmitsUndefined(typeNode: SyntaxNode): boolean {
	if (annotationIncludesTopLevelUndefined(typeNode)) return true;
	return typeAdmitsUndefined(typeNode.getType?.());
}

function typeAdmitsUndefined(
	type: ReturnType<NonNullable<SyntaxNode['getType']>> | undefined,
): boolean {
	if (type === undefined) return false;
	if (type.isUndefined?.() === true) return true;
	if (!type.isUnion()) return false;
	return type.getUnionTypes().some((member) => member.isUndefined?.() === true);
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
	if (localName !== undefined && localName.length > 0) {
		const local = reference.getSourceFile().getExportedDeclarations().get(localName)?.[0];
		if (local !== undefined) candidates.push(local);
	}

	for (const declaration of candidates) {
		if (declaration.getKindName() !== 'TypeAliasDeclaration') continue;
		const filePath = declaration.getSourceFile().getFilePath();
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

export interface ResolvedDeclaredTypeAnnotations {
	/** Nodes to register definitions from (deduped by annotation text). */
	nodes: ReadonlyArray<SyntaxNode>;
	/**
	 * Sole node to use for `typeHref` linking when every distinct annotation shares one root alias.
	 * Absent when branches declare different valid shapes.
	 */
	singleLinkNode: SyntaxNode | undefined;
	/**
	 * Declared type text for the props table. A single shared annotation, or a `|`-joined union of
	 * distinct valid annotations. Undefined when there are no written annotations.
	 */
	text: string | undefined;
}

/**
 * Resolves written annotations across union branches into documentation text.
 *
 * - Exclusivity (`never` vs a real type): keep the non-`never` annotation.
 * - Identical annotations on every branch: keep that shared text.
 * - Distinct valid annotations: join them as a union so docs do not narrow the public contract.
 */
export function resolveDeclaredTypeAnnotations(
	typeNodes: ReadonlyArray<SyntaxNode>,
): ResolvedDeclaredTypeAnnotations {
	if (typeNodes.length === 0) {
		return { nodes: [], singleLinkNode: undefined, text: undefined };
	}

	const nonNever = typeNodes.filter((node) => !isNeverAnnotation(node));
	const pool = nonNever.length > 0 ? nonNever : [...typeNodes];

	const uniqueByText = new Map<string, SyntaxNode>();
	for (const node of pool) {
		const text = node.getText().trim();
		if (text.length === 0) continue;
		if (!uniqueByText.has(text)) uniqueByText.set(text, node);
	}

	if (uniqueByText.size === 0) {
		return { nodes: [], singleLinkNode: undefined, text: undefined };
	}

	const nodes = [...uniqueByText.values()];
	if (uniqueByText.size === 1) {
		const node = nodes[0]!;
		return {
			nodes,
			singleLinkNode: node,
			text: node.getText().trim(),
		};
	}

	const text = [...uniqueByText.keys()].map(parenthesizeForUnionMember).join(' | ');
	const linkNames = new Set(
		nodes
			.map((node) => {
				const reference = rootTypeReference(node);
				return reference?.getTypeName?.()?.getText() ?? reference?.getText();
			})
			.filter((name): name is string => name !== undefined && name.length > 0),
	);
	const singleLinkNode =
		linkNames.size === 1 && nodes.every((node) => rootTypeReference(node) !== undefined)
			? nodes[0]
			: undefined;

	return { nodes, singleLinkNode, text };
}

/** Wrap members that would be misparsed inside a larger union (functions, nested unions). */
function parenthesizeForUnionMember(text: string): string {
	if (text.includes('=>') || text.includes('|')) return `(${text})`;
	return text;
}

function isNeverAnnotation(typeNode: SyntaxNode): boolean {
	if (typeNode.getKindName() === 'NeverKeyword') return true;
	return typeNode.getType?.().isNever() === true;
}

/**
 * Collects every written type annotation for each prop name across a union of constituents.
 * Unlike a first-wins symbol map, this preserves branch-specific declarations such as
 * `renderRoot?: never` vs `renderRoot: (…) => …`.
 */
function annotationsByPropName(
	declaration: PropDeclaration,
): Map<string, ReadonlyArray<SyntaxNode>> {
	const type = declaration.getType();
	const constituents = type.isUnion() ? type.getUnionTypes() : [type];
	const annotations = new Map<string, Array<SyntaxNode>>();

	for (const constituent of constituents) {
		for (const prop of constituent.getProperties()) {
			const name = prop.getName();
			const bucket = annotations.get(name) ?? [];
			for (const propDeclaration of prop.getDeclarations()) {
				const typeNode = propDeclaration.getTypeNode?.();
				if (typeNode !== undefined) bucket.push(typeNode);
			}
			if (bucket.length > 0) annotations.set(name, bucket);
		}
	}

	return annotations;
}
