import { describe, expect, it } from 'vitest';
import { discoverExports } from '../discover-exports.js';

describe('discoverExports', () => {
	it('classifies component-shaped exports as component shape', () => {
		const exports = {
			'./button': './dist/button/index.js',
			'./close-button': './dist/close-button/index.js',
		};
		const result = discoverExports(exports);
		expect(result.find((e) => e.path === './button')?.shape).toBe('component');
	});

	it('classifies primitive paths as component shape with primitive tier', () => {
		const exports = { './button/primitive': './dist/button/primitive/index.js' };
		const result = discoverExports(exports);
		const entry = result.find((e) => e.path === './button/primitive');
		expect(entry?.shape).toBe('component');
		expect(entry?.tier).toBe('primitive');
	});

	it('classifies recipes/theme/tokens/utils as barrel', () => {
		const exports = {
			'./recipes': './dist/recipes/index.js',
			'./theme': './dist/theme/index.js',
			'./tokens': './dist/tokens/index.js',
			'./utils': './dist/utils/index.js',
		};
		const result = discoverExports(exports);
		expect(result.every((e) => e.shape === 'barrel')).toBe(true);
	});

	it('classifies stylesheet/spritesheet/package.json as asset', () => {
		const exports = {
			'./stylesheet.css': './dist/stylesheet.css',
			'./spritesheet.svg': './dist/spritesheet.svg',
			'./package.json': './package.json',
		};
		const result = discoverExports(exports);
		expect(result.every((e) => e.shape === 'asset')).toBe(true);
	});

	it('skips ./package.json from the page-emitting list (asset)', () => {
		const exports = { './package.json': './package.json' };
		const result = discoverExports(exports);
		const entry = result.find((e) => e.path === './package.json');
		expect(entry?.shape).toBe('asset');
	});
});
