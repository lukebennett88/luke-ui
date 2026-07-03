import { DEFAULT_BARREL_PATHS } from '@luke-ui/docs-tools/discover-exports';
import { describe, expect, it } from 'vite-plus/test';
import packageJson from '../package.json' with { type: 'json' };

describe('generate-docs package interface conformance', () => {
	it('keeps DEFAULT_BARREL_PATHS in sync with the real package exports', () => {
		const realExportPaths = new Set(Object.keys(packageJson.exports));
		for (const barrelPath of DEFAULT_BARREL_PATHS) {
			expect(realExportPaths.has(barrelPath)).toBe(true);
		}
	});
});
