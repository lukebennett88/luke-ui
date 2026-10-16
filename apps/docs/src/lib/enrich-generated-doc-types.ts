import { isAbsolute, relative, resolve } from 'node:path';
import type { DocEntry, GeneratedDoc } from 'fumadocs-typescript';
import type { PropDeclaration, SyntaxNode } from './component-prop-analysis.js';
import type { EnrichedGeneratedDoc, TypeDefinitionsPayload } from './type-definition-model.js';

/** Bare kind names fumadocs can put in `simplifiedType` in place of a readable signature. */
const KIND_LABELS = new Set(['union', 'object', 'intersection', 'tuple', 'array', 'function']);

const TRAILING_UNDEFINED = ' | undefined';

/**
 * Restores the declared type of each prop and links Luke UI type aliases to their source
 * declarations. The definitions travel on the doc as `typeDefinitions`, not as a prop entry.
 */
export function enrichGeneratedDocTypes(
	doc: GeneratedDoc,
	propsDeclaration: PropDeclaration,
	reactSrcDir: string,
): EnrichedGeneratedDoc {
	const annotationsByName = annotationsByPropName(propsDeclaration);
	const definitions: TypeDefinitionsPayload = {};

	const entries = doc.entries.map((entry) => {
		const annotations = annotationsByName.get(entry.name) ?? [];
		const declared = sharedAnnotation(annotations);

		// An indexed access such as `RacButtonProps['onPress']` hides the shape, so the resolved
		// signature reads better there.
		if (declared !== undefined && !isLowReadabilityAnnotation(declared)) {
			const text = declared.getText().trim();
			const alias = resolveLukeTypeAlias(declared, reactSrcDir);
			if (alias !== undefined) definitions[alias.name] = alias;

			return {
				...entry,
				simplifiedType: text,
				type: text,
				typeHref: alias?.name ?? entry.typeHref,
			};
		}

		if (annotations.length === 0 && !KIND_LABELS.has(entry.simplifiedType)) return entry;
		if (entry.type.length === 0 || entry.type === 'union') return entry;

		const type = resolvedTypeText(entry, annotations);
		return { ...entry, simplifiedType: type, type };
	});

	if (Object.keys(definitions).length === 0) return { ...doc, entries };
	return { ...doc, entries, typeDefinitions: definitions };
}

/**
 * The annotation every union branch writes for a prop. A branch that writes `never` only excludes
 * the prop, so it gives way to the branches with a real type. When branches write different types,
 * no one annotation describes the prop and fumadocs' resolved type is used instead.
 */
function sharedAnnotation(typeNodes: ReadonlyArray<SyntaxNode>): SyntaxNode | undefined {
	const realNodes = typeNodes.filter((node) => !isNeverAnnotation(node));
	const candidates = realNodes.length > 0 ? realNodes : typeNodes;
	const texts = new Set(candidates.map((node) => node.getText().trim()));
	if (texts.size !== 1 || texts.has('')) return;

	return candidates[0];
}

function isLowReadabilityAnnotation(typeNode: SyntaxNode): boolean {
	switch (typeNode.getKindName()) {
		case 'IndexedAccessType':
		case 'ImportType':
		case 'TypeQuery':
			return true;
		case 'ParenthesizedType': {
			const inner = typeNode.getTypeNode?.();
			return inner !== undefined && isLowReadabilityAnnotation(inner);
		}
		case 'UnionType': {
			const members = typeNode.getTypeNodes?.() ?? [];
			return members.length > 0 && members.every(isLowReadabilityAnnotation);
		}
		default:
			return false;
	}
}

/**
 * fumadocs' resolved type, minus the trailing `| undefined` TypeScript adds to an optional prop.
 * The suffix stays when a written annotation admits `undefined` itself.
 */
function resolvedTypeText(entry: DocEntry, annotationNodes: ReadonlyArray<SyntaxNode>): string {
	if (entry.required || annotationNodes.length === 0) return entry.type;
	if (annotationNodes.some(annotationAdmitsUndefined)) return entry.type;
	if (!entry.type.endsWith(TRAILING_UNDEFINED)) return entry.type;

	return entry.type.slice(0, -TRAILING_UNDEFINED.length);
}

/**
 * True when the written annotation's own type includes `undefined`, whether written out or reached
 * through an indexed access such as `Holder['value']`. A nested `Foo<string | undefined>` does not
 * count.
 */
function annotationAdmitsUndefined(typeNode: SyntaxNode): boolean {
	const type = typeNode.getType?.();
	if (type === undefined) return false;
	if (type.isUndefined()) return true;
	return type.isUnion() && type.getUnionTypes().some((member) => member.isUndefined());
}

/** The Luke UI type alias an annotation names, with its declaration as the definition. */
function resolveLukeTypeAlias(
	typeNode: SyntaxNode,
	reactSrcDir: string,
): { definition: string; name: string } | undefined {
	const reference = rootTypeReference(typeNode);
	if (reference === undefined) return;

	const typeName = reference.getTypeName?.();
	const symbol =
		typeName?.getSymbol?.() ?? reference.getSymbol?.() ?? reference.getType?.().getAliasSymbol();
	const declarations = (symbol?.getAliasedSymbol?.() ?? symbol)?.getDeclarations() ?? [];

	for (const declaration of declarations) {
		if (declaration.getKindName() !== 'TypeAliasDeclaration') continue;
		if (!isInsideDir(declaration.getSourceFile().getFilePath(), reactSrcDir)) continue;

		const name = declaration.getName?.();
		if (name === undefined || name.length === 0) continue;

		const text = declaration.getText().trim();
		return { definition: text.startsWith('export ') ? text.slice('export '.length) : text, name };
	}
	return;
}

function rootTypeReference(typeNode: SyntaxNode | undefined): SyntaxNode | undefined {
	if (typeNode === undefined) return;
	switch (typeNode.getKindName()) {
		case 'TypeReference':
			return typeNode;
		case 'ParenthesizedType':
			return rootTypeReference(typeNode.getTypeNode?.());
		default:
			return;
	}
}

function isInsideDir(filePath: string, dir: string): boolean {
	const relativePath = relative(resolve(dir), resolve(filePath));
	return relativePath !== '' && !relativePath.startsWith('..') && !isAbsolute(relativePath);
}

function isNeverAnnotation(typeNode: SyntaxNode): boolean {
	if (typeNode.getKindName() === 'NeverKeyword') return true;
	return typeNode.getType?.().isNever() === true;
}

/**
 * Every written annotation of each prop across the declaration's union constituents. A first-wins
 * symbol lookup would keep only one branch, such as `renderRoot?: never` in an element branch.
 */
function annotationsByPropName(
	declaration: PropDeclaration,
): Map<string, ReadonlyArray<SyntaxNode>> {
	const type = declaration.getType();
	const constituents = type.isUnion() ? type.getUnionTypes() : [type];
	const annotations = new Map<string, Array<SyntaxNode>>();

	for (const constituent of constituents) {
		for (const prop of constituent.getProperties()) {
			for (const propDeclaration of prop.getDeclarations()) {
				const typeNode = propDeclaration.getTypeNode?.();
				if (typeNode === undefined) continue;

				const bucket = annotations.get(prop.getName());
				if (bucket === undefined) annotations.set(prop.getName(), [typeNode]);
				else bucket.push(typeNode);
			}
		}
	}

	return annotations;
}
