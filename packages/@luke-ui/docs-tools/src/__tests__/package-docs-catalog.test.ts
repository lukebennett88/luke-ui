import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';
import { resolvePackageDocsCatalog } from '../package-docs-catalog.js';

const packageRoot = fileURLToPath(new URL('./fixtures/sample-package/', import.meta.url));

describe('resolvePackageDocsCatalog', () => {
	it('resolves final metadata and parsed data for every export', () => {
		const catalog = resolvePackageDocsCatalog({
			packageRoot,
			exportsField: {
				'./sample': './dist/sample/index.js',
				'./kit/primitive': './dist/kit/primitive/index.js',
				'./stylesheet.css': './dist/stylesheet.css',
			},
		});

		const component = catalog.find((entry) => entry.path === './sample');
		expect(component).toMatchObject({
			path: './sample',
			shape: 'component',
			pageKind: 'component',
			tier: 'atom',
			title: 'Sample',
			description: 'Sample atom description.',
			sourcePath: expect.stringContaining('/src/sample/index.tsx'),
			parsed: {
				componentName: 'Sample',
			},
		});

		const primitiveKit = catalog.find((entry) => entry.path === './kit/primitive');
		expect(primitiveKit).toMatchObject({
			shape: 'component',
			pageKind: 'barrel',
			tier: 'primitive',
			title: 'Kit (primitive)',
			sourcePath: expect.stringContaining('/src/kit/primitive/index.tsx'),
			parsed: {
				exports: expect.arrayContaining([
					expect.objectContaining({ name: 'KitControl' }),
					expect.objectContaining({ name: 'KitItem' }),
				]),
			},
		});

		const asset = catalog.find((entry) => entry.path === './stylesheet.css');
		expect(asset).toMatchObject({
			shape: 'asset',
			pageKind: 'asset',
			tier: 'n/a',
			title: 'Stylesheet',
			description: '',
		});
		expect(asset).not.toHaveProperty('sourcePath');
		expect(asset).not.toHaveProperty('parsed');
	});

	it('throws with the export path and target when a non-asset source is missing', () => {
		expect(() =>
			resolvePackageDocsCatalog({
				packageRoot,
				exportsField: {
					'./missing': './dist/missing/index.js',
				},
			}),
		).toThrow(
			'Could not resolve source for package export "./missing" targeting "./dist/missing/index.js".',
		);
	});
});
