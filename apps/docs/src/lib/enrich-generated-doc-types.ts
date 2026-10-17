import { dirname } from 'node:path';
import type { DocEntry, GeneratedDoc } from 'fumadocs-typescript';
import { ts } from 'ts-morph';
import { createTypeDefinitionCollector } from './collect-type-definitions.js';
import type { PropDeclaration, SyntaxNode } from './component-prop-analysis.js';
import type { EnrichedGeneratedDoc } from './type-definition-model.js';
import type { TypeToken } from './type-tokens.js';
import { typeTokensToText } from './type-tokens.js';

/**
 * Formats each prop's declared type, or its resolved type when no single annotation describes it,
 * and collects the definitions of the types those signatures name. The formatted rows travel on the
 * doc as `typeTokens` and the definitions as `typeDefinitions`, not as prop entries. Each row's text
 * is its tokens on one line.
 */
export function enrichGeneratedDocTypes(
	doc: GeneratedDoc,
	propsDeclaration: PropDeclaration,
	reactSrcDir: string,
	checker: ts.TypeChecker,
): EnrichedGeneratedDoc {
	const annotationsByName = annotationsByPropName(propsDeclaration);
	const declarationNode = propsDeclaration.compilerNode;
	const declaredType = checker.getTypeAtLocation(declarationNode);
	const collector = createTypeDefinitionCollector({
		checker,
		enclosingDeclaration: declarationNode,
		packageDir: dirname(reactSrcDir),
	});
	const typeTokens: Record<string, Array<TypeToken>> = {};

	function withTokens(entry: DocEntry, tokens: Array<TypeToken>): DocEntry {
		typeTokens[entry.name] = tokens;
		const text = typeTokensToText(tokens, { multiline: false });
		return { ...entry, simplifiedType: text, type: text };
	}

	const entries = doc.entries.map((entry) => {
		const annotations = annotationsByName.get(entry.name) ?? [];
		const declared = sharedAnnotation(annotations, propsDeclaration, checker);

		// An indexed access such as `RacButtonProps['onPress']` hides the shape, so the resolved
		// signature reads better there.
		if (declared !== undefined && !isLowReadabilityAnnotation(declared)) {
			return withTokens(entry, collector.addTypeNode(declared.compilerNode as ts.TypeNode));
		}

		const prop = checker.getPropertyOfType(declaredType, entry.name);
		if (prop === undefined) return entry;

		const tokens = collector.addType(checker.getTypeOfSymbolAtLocation(prop, declarationNode), {
			omitUndefined: impliesUndefined(entry, annotations),
		});
		return tokens === undefined ? entry : withTokens(entry, tokens);
	});

	const typeDefinitions = collector.definitions();
	return {
		...doc,
		entries,
		...(typeDefinitions === undefined ? {} : { typeDefinitions }),
		...(Object.keys(typeTokens).length === 0 ? {} : { typeTokens }),
	};
}

/**
 * True when the `undefined` in an optional prop's resolved type comes only from the `?`. It stays
 * when a written annotation admits `undefined` itself.
 */
function impliesUndefined(entry: DocEntry, annotationNodes: ReadonlyArray<SyntaxNode>): boolean {
	if (entry.required || annotationNodes.length === 0) return false;
	return !annotationNodes.some(annotationAdmitsUndefined);
}

/**
 * The annotation every union branch writes for a prop. A branch that writes `never` only excludes
 * the prop, so it gives way to the branches with a real type. When branches write different types,
 * no one annotation describes the prop and fumadocs' resolved type is used instead.
 */
function sharedAnnotation(
	typeNodes: ReadonlyArray<SyntaxNode>,
	propsDeclaration: PropDeclaration,
	checker: ts.TypeChecker,
): SyntaxNode | undefined {
	const realNodes = typeNodes.filter((node) => !isNeverAnnotation(node));
	const candidates = realNodes.length > 0 ? realNodes : typeNodes;
	const texts = new Set(candidates.map((node) => node.getText().trim()));
	if (texts.size !== 1 || texts.has('')) return;

	const [candidate] = candidates;
	if (namesOuterTypeParameter(candidate!.compilerNode, propsDeclaration.compilerNode, checker)) {
		return;
	}
	return candidate;
}

/**
 * True when an annotation names a type parameter of another generic declaration, such as `T` in
 * React Aria's `children?: ChildrenOrFunction<T>`. The written text would show `T` where the props
 * type supplies an argument, so the resolved type reads correctly and the annotation does not.
 */
function namesOuterTypeParameter(
	node: ts.Node,
	propsDeclaration: ts.Node,
	checker: ts.TypeChecker,
): boolean {
	if (ts.isTypeReferenceNode(node)) {
		const symbol = checker.getSymbolAtLocation(node.typeName);
		const owner = symbol?.declarations?.[0]?.parent;
		if (symbol !== undefined && symbol.flags & ts.SymbolFlags.TypeParameter) {
			if (owner !== propsDeclaration) return true;
		}
	}
	return (
		ts.forEachChild(
			node,
			(child) => namesOuterTypeParameter(child, propsDeclaration, checker) || undefined,
		) === true
	);
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
