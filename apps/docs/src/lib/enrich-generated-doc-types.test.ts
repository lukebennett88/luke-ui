import { expect, test } from 'vite-plus/test';
import type { SyntaxNode } from './component-prop-analysis.js';
import {
	annotationIncludesTopLevelUndefined,
	isLowReadabilityDeclaredType,
	resolveDeclaredTypeAnnotations,
	selectDeclaredTypeNode,
	shouldPreferDeclaredAnnotation,
	stripTrailingOptionalUndefined,
} from './enrich-generated-doc-types.js';

function node(
	kind: string,
	options: {
		isNever?: boolean;
		text?: string;
		typeName?: string;
		typeNodes?: ReadonlyArray<SyntaxNode>;
	} = {},
): SyntaxNode {
	return {
		getKindName: () => kind,
		getSourceFile: () => ({ getExportedDeclarations: () => new Map(), getFilePath: () => '' }),
		getStart: () => 0,
		getText: () => options.text ?? kind,
		getType: () => ({
			getProperties: () => [],
			getUnionTypes: () => [],
			isNever: () => options.isNever === true,
			isUnion: () => false,
		}),
		getTypeName:
			options.typeName === undefined
				? undefined
				: () =>
						node('Identifier', {
							text: options.typeName,
						}),
		getTypeNodes: options.typeNodes === undefined ? undefined : () => options.typeNodes ?? [],
	};
}

test('annotationIncludesTopLevelUndefined detects only outer undefined constituents', () => {
	expect(annotationIncludesTopLevelUndefined(node('UndefinedKeyword'))).toBe(true);

	expect(
		annotationIncludesTopLevelUndefined(
			node('UnionType', {
				text: 'string | undefined',
				typeNodes: [node('StringKeyword', { text: 'string' }), node('UndefinedKeyword')],
			}),
		),
	).toBe(true);

	expect(
		annotationIncludesTopLevelUndefined(
			node('TypeReference', {
				text: 'ReadonlyArray<string | undefined>',
				typeName: 'ReadonlyArray',
			}),
		),
	).toBe(false);
});

test('selectDeclaredTypeNode prefers non-never annotations across union branches', () => {
	const neverNode = node('NeverKeyword', { isNever: true, text: 'never' });
	const aliasNode = node('TypeReference', {
		text: 'BranchRenderProp',
		typeName: 'BranchRenderProp',
	});
	const primitiveNode = node('StringKeyword', { text: 'string' });

	expect(selectDeclaredTypeNode([neverNode, aliasNode])?.getText()).toBe('BranchRenderProp');
	expect(selectDeclaredTypeNode([neverNode, primitiveNode])?.getText()).toBe('string');
	expect(selectDeclaredTypeNode([aliasNode, neverNode])?.getText()).toBe('BranchRenderProp');
	expect(selectDeclaredTypeNode([neverNode])?.getText()).toBe('never');
});

test('resolveDeclaredTypeAnnotations joins distinct valid branch annotations', () => {
	const elementMode = node('TypeReference', { text: 'ElementMode', typeName: 'ElementMode' });
	const renderMode = node('TypeReference', { text: 'RenderMode', typeName: 'RenderMode' });
	const neverNode = node('NeverKeyword', { isNever: true, text: 'never' });

	const resolved = resolveDeclaredTypeAnnotations([elementMode, renderMode]);
	expect(resolved.text).toBe('ElementMode | RenderMode');
	expect(resolved.singleLinkNode).toBeUndefined();
	expect(resolved.nodes.map((entry) => entry.getText())).toEqual(['ElementMode', 'RenderMode']);

	const withNever = resolveDeclaredTypeAnnotations([neverNode, elementMode, renderMode]);
	expect(withNever.text).toBe('ElementMode | RenderMode');
	expect(withNever.singleLinkNode).toBeUndefined();
});

test('resolveDeclaredTypeAnnotations parenthesizes function and nested-union members', () => {
	const callback = node('FunctionType', {
		text: '(props: { className?: string }) => null',
	});
	const alias = node('TypeReference', { text: 'SharedBranchAlias', typeName: 'SharedBranchAlias' });

	expect(resolveDeclaredTypeAnnotations([callback, alias]).text).toBe(
		'((props: { className?: string }) => null) | SharedBranchAlias',
	);
});

test('resolveDeclaredTypeAnnotations keeps a shared identical annotation', () => {
	const first = node('TypeReference', {
		text: 'SharedBranchAlias',
		typeName: 'SharedBranchAlias',
	});
	const second = node('TypeReference', {
		text: 'SharedBranchAlias',
		typeName: 'SharedBranchAlias',
	});

	const resolved = resolveDeclaredTypeAnnotations([first, second]);
	expect(resolved.text).toBe('SharedBranchAlias');
	expect(resolved.singleLinkNode?.getText()).toBe('SharedBranchAlias');
	expect(resolved.nodes).toHaveLength(1);
});

test('indexed-access annotations are low-readability and lose to the resolved type', () => {
	const indexed = node('IndexedAccessType', {
		text: "RacButtonProps['onPress']",
	});
	expect(isLowReadabilityDeclaredType(indexed)).toBe(true);
	expect(shouldPreferDeclaredAnnotation(resolveDeclaredTypeAnnotations([indexed]))).toBe(false);

	const alias = node('TypeReference', {
		text: 'PressAction',
		typeName: 'PressAction',
	});
	expect(isLowReadabilityDeclaredType(alias)).toBe(false);
	expect(shouldPreferDeclaredAnnotation(resolveDeclaredTypeAnnotations([alias]))).toBe(true);
});

test('stripTrailingOptionalUndefined removes only a trailing top-level undefined', () => {
	expect(stripTrailingOptionalUndefined('((e: PressEvent) => void) | undefined')).toBe(
		'((e: PressEvent) => void)',
	);
	expect(stripTrailingOptionalUndefined('string | number')).toBe('string | number');
});
