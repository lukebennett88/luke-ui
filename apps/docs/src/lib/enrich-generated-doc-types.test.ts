import { expect, test } from 'vite-plus/test';
import type { SyntaxNode } from './component-prop-analysis.js';
import {
	annotationIncludesTopLevelUndefined,
	selectDeclaredTypeNode,
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
