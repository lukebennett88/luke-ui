import { expect, test } from 'vite-plus/test';
import { annotationIncludesTopLevelUndefined } from './enrich-generated-doc-types.js';

test('annotationIncludesTopLevelUndefined detects only outer undefined constituents', () => {
	expect(
		annotationIncludesTopLevelUndefined({
			getKindName: () => 'UndefinedKeyword',
			getSourceFile: () => ({ getExportedDeclarations: () => new Map(), getFilePath: () => '' }),
			getStart: () => 0,
			getText: () => 'undefined',
		}),
	).toBe(true);

	expect(
		annotationIncludesTopLevelUndefined({
			getKindName: () => 'UnionType',
			getSourceFile: () => ({ getExportedDeclarations: () => new Map(), getFilePath: () => '' }),
			getStart: () => 0,
			getText: () => 'string | undefined',
			getTypeNodes: () => [
				{
					getKindName: () => 'StringKeyword',
					getSourceFile: () => ({
						getExportedDeclarations: () => new Map(),
						getFilePath: () => '',
					}),
					getStart: () => 0,
					getText: () => 'string',
				},
				{
					getKindName: () => 'UndefinedKeyword',
					getSourceFile: () => ({
						getExportedDeclarations: () => new Map(),
						getFilePath: () => '',
					}),
					getStart: () => 0,
					getText: () => 'undefined',
				},
			],
		}),
	).toBe(true);

	expect(
		annotationIncludesTopLevelUndefined({
			getKindName: () => 'TypeReference',
			getSourceFile: () => ({ getExportedDeclarations: () => new Map(), getFilePath: () => '' }),
			getStart: () => 0,
			getText: () => 'ReadonlyArray<string | undefined>',
			getTypeArguments: () => [
				{
					getKindName: () => 'UnionType',
					getSourceFile: () => ({
						getExportedDeclarations: () => new Map(),
						getFilePath: () => '',
					}),
					getStart: () => 0,
					getText: () => 'string | undefined',
					getTypeNodes: () => [
						{
							getKindName: () => 'UndefinedKeyword',
							getSourceFile: () => ({
								getExportedDeclarations: () => new Map(),
								getFilePath: () => '',
							}),
							getStart: () => 0,
							getText: () => 'undefined',
						},
					],
				},
			],
		}),
	).toBe(false);
});
