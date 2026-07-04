import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';
import { discoverExports } from './discover-exports.js';

const packageRoot = fileURLToPath(new URL('./fixtures/sample-package/', import.meta.url));

describe('discoverExports', () => {
	it('classifies component-shaped exports as component shape', () => {
		const exports = {
			'./button': './dist/button/index.js',
			'./icon-button': './dist/icon-button/index.js',
		};
		const result = discoverExports(exports);
		expect(result.find((e) => e.path === './button')?.shape).toBe('component');
		expect(result.find((e) => e.path === './button')?.pageKind).toBe('component');
	});

	it('classifies primitive paths as component shape with primitive tier', () => {
		const exports = { './button/primitive': './dist/button/primitive/index.js' };
		const result = discoverExports(exports);
		const entry = result.find((e) => e.path === './button/primitive');
		expect(entry?.shape).toBe('component');
		expect(entry?.pageKind).toBe('component');
		expect(entry?.tier).toBe('primitive');
	});

	it('classifies single-export primitive sources as component pages', () => {
		const exports = { './single/primitive': './dist/single/primitive/index.js' };
		const result = discoverExports(exports, { packageRoot });
		const entry = result.find((e) => e.path === './single/primitive');
		expect(entry?.shape).toBe('component');
		expect(entry?.pageKind).toBe('component');
		expect(entry?.sourcePath).toContain('/src/single/primitive/index.tsx');
	});

	it('classifies multi-export primitive sources as barrel pages', () => {
		const exports = { './kit/primitive': './dist/kit/primitive/index.js' };
		const result = discoverExports(exports, { packageRoot });
		const entry = result.find((e) => e.path === './kit/primitive');
		expect(entry?.shape).toBe('component');
		expect(entry?.pageKind).toBe('barrel');
		expect(entry?.tier).toBe('primitive');
	});

	it('classifies multi-export foundations as barrel', () => {
		const exports = {
			'./heading-context': './dist/heading-context/index.js',
			'./icon-size-context': './dist/icon-size-context/index.js',
			'./recipes': './dist/recipes/index.js',
			'./theme': './dist/theme/index.js',
			'./tokens': './dist/tokens/index.js',
			'./utils': './dist/utils/index.js',
		};
		const result = discoverExports(exports);
		expect(result.every((e) => e.shape === 'barrel')).toBe(true);
		expect(result.every((e) => e.pageKind === 'barrel')).toBe(true);
	});

	it('classifies styles as foundation barrel API', () => {
		const exports = { './styles': './dist/styles/index.js' };

		const result = discoverExports(exports);

		expect(result.find((e) => e.path === './styles')).toMatchObject({
			pageKind: 'barrel',
			shape: 'barrel',
		});
	});

	it('classifies stylesheet/spritesheet/package.json as asset', () => {
		const exports = {
			'./package.json': './package.json',
			'./spritesheet.svg': './dist/spritesheet.svg',
			'./stylesheet.css': './dist/stylesheet.css',
		};
		const result = discoverExports(exports);
		expect(result.every((e) => e.shape === 'asset')).toBe(true);
		expect(result.every((e) => e.pageKind === 'asset')).toBe(true);
	});

	it('skips ./package.json from the page-emitting list (asset)', () => {
		const exports = { './package.json': './package.json' };
		const result = discoverExports(exports);
		const entry = result.find((e) => e.path === './package.json');
		expect(entry?.shape).toBe('asset');
	});
});
