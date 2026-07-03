import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';
import { resolvePackageDocsCatalog } from '../package-docs-catalog.js';

const packageRoot = fileURLToPath(new URL('./fixtures/sample-package/', import.meta.url));

describe('resolvePackageDocsCatalog', () => {
	it('resolves final metadata and parsed data for every export', () => {
		const catalog = resolvePackageDocsCatalog({
			exportsField: {
				'./kit/primitive': './dist/kit/primitive/index.js',
				'./sample': './dist/sample/index.js',
				'./stylesheet.css': './dist/stylesheet.css',
			},
			packageRoot,
		});

		const component = catalog.find((entry) => entry.path === './sample');
		expect(component).toMatchObject({
			description: 'Sample atom description.',
			pageKind: 'component',
			parsed: {
				componentName: 'Sample',
			},
			path: './sample',
			shape: 'component',
			sourcePath: expect.stringContaining('/src/sample/index.tsx'),
			tier: 'atom',
			title: 'Sample',
		});

		const primitiveKit = catalog.find((entry) => entry.path === './kit/primitive');
		expect(primitiveKit).toMatchObject({
			pageKind: 'barrel',
			parsed: {
				exports: expect.arrayContaining([
					expect.objectContaining({ name: 'KitControl' }),
					expect.objectContaining({ name: 'KitItem' }),
				]),
			},
			shape: 'component',
			sourcePath: expect.stringContaining('/src/kit/primitive/index.tsx'),
			tier: 'primitive',
			title: 'Kit (primitive)',
		});

		const asset = catalog.find((entry) => entry.path === './stylesheet.css');
		expect(asset).toMatchObject({
			description: '',
			pageKind: 'asset',
			shape: 'asset',
			tier: 'n/a',
			title: 'Stylesheet',
		});
		expect(asset).not.toHaveProperty('sourcePath');
		expect(asset).not.toHaveProperty('parsed');
	});

	it('throws with the export path and target when a non-asset source is missing', () => {
		expect(() =>
			resolvePackageDocsCatalog({
				exportsField: {
					'./missing': './dist/missing/index.js',
				},
				packageRoot,
			}),
		).toThrow(
			'Could not resolve source for package export "./missing" targeting "./dist/missing/index.js".',
		);
	});
});
