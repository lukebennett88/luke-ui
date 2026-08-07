import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vite-plus/test';
import packageJson from '../../package.json' with { type: 'json' };
import { themeClassName as paperThemeClassName } from './paper/index.js';
import { themeClassName as tactileThemeClassName } from './tactile/index.js';

const themeArtifacts = {
	paper: new URL('../../dist/themes/paper.css', import.meta.url),
	tactile: new URL('../../dist/themes/tactile.css', import.meta.url),
} as const;

const themeEntrypoints = {
	paper: new URL('../../dist/themes/paper/index.js', import.meta.url),
	tactile: new URL('../../dist/themes/tactile/index.js', import.meta.url),
} as const;

describe('bundled theme package exports', () => {
	it('publishes a per-theme entrypoint and stylesheet, with no combined barrel', () => {
		expect(packageJson.exports['./themes/tactile']).toBe('./dist/themes/tactile/index.js');
		expect(packageJson.exports['./themes/paper']).toBe('./dist/themes/paper/index.js');
		expect(packageJson.exports['./themes/tactile.css']).toBe('./dist/themes/tactile.css');
		expect(packageJson.exports['./themes/paper.css']).toBe('./dist/themes/paper.css');
		expect('./themes' in packageJson.exports).toBe(false);
	});

	it('exports each generated stylesheet as an independent package entrypoint', async () => {
		const paperCss = await readFile(themeArtifacts.paper, 'utf8');
		const tactileCss = await readFile(themeArtifacts.tactile, 'utf8');

		expect(paperCss).toContain(`.${paperThemeClassName} {`);
		expect(paperCss).not.toContain(tactileThemeClassName);
		expect(tactileCss).toContain(`.${tactileThemeClassName} {`);
		expect(tactileCss).not.toContain(paperThemeClassName);
	});

	// Pins the coupling the old combined barrel had: each per-theme entrypoint must import only
	// its own foundation leaf, so a consumer of one theme never pulls the other into their bundle.
	it('keeps each built theme entrypoint decoupled from the other theme', async () => {
		const paperEntry = await readFile(themeEntrypoints.paper, 'utf8');
		const tactileEntry = await readFile(themeEntrypoints.tactile, 'utf8');

		expect(paperEntry).not.toContain('tactile');
		expect(tactileEntry).not.toContain('paper');
	});
});
