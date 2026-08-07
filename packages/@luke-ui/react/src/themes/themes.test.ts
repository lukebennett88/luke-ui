import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vite-plus/test';
import packageJson from '../../package.json' with { type: 'json' };
import { getThemeClassName } from '../theme/theme-class-name.js';
import { theme as paperThemeInput, themeClassName as paperThemeClassName } from './paper/index.js';
import {
	theme as tactileThemeInput,
	themeClassName as tactileThemeClassName,
} from './tactile/index.js';

const themeArtifacts = {
	paper: new URL('../../dist/themes/paper/stylesheet.css', import.meta.url),
	tactile: new URL('../../dist/themes/tactile/stylesheet.css', import.meta.url),
} as const;

const themeEntrypoints = {
	paper: new URL('../../dist/themes/paper/index.js', import.meta.url),
	tactile: new URL('../../dist/themes/tactile/index.js', import.meta.url),
} as const;

describe('bundled theme package exports', () => {
	it('publishes a per-theme entrypoint and stylesheet, with no combined barrel', () => {
		expect(packageJson.exports['./themes/tactile']).toBe('./dist/themes/tactile/index.js');
		expect(packageJson.exports['./themes/paper']).toBe('./dist/themes/paper/index.js');
		expect(packageJson.exports['./themes/tactile/stylesheet.css']).toBe(
			'./dist/themes/tactile/stylesheet.css',
		);
		expect(packageJson.exports['./themes/paper/stylesheet.css']).toBe(
			'./dist/themes/paper/stylesheet.css',
		);
		expect('./themes' in packageJson.exports).toBe(false);
	});

	// Each identity-class leaf holds its theme's name as a literal, so the class costs a consumer
	// nothing but the string. That literal can drift from the foundation's own `name`.
	it('derives each identity class from its own theme name', () => {
		expect(paperThemeClassName).toBe(getThemeClassName(paperThemeInput.name));
		expect(tactileThemeClassName).toBe(getThemeClassName(tactileThemeInput.name));
	});

	it('exports each generated stylesheet as an independent package entrypoint', async () => {
		const paperCss = await readFile(themeArtifacts.paper, 'utf8');
		const tactileCss = await readFile(themeArtifacts.tactile, 'utf8');

		expect(paperCss).toContain(`.${paperThemeClassName} {`);
		expect(paperCss).not.toContain(tactileThemeClassName);
		expect(tactileCss).toContain(`.${tactileThemeClassName} {`);
		expect(tactileCss).not.toContain(paperThemeClassName);
	});

	// Each per-theme entrypoint must import only its own foundation leaf, so a consumer of one theme
	// never pulls the other into their bundle.
	it('keeps each built theme entrypoint decoupled from the other theme', async () => {
		const paperEntry = await readFile(themeEntrypoints.paper, 'utf8');
		const tactileEntry = await readFile(themeEntrypoints.tactile, 'utf8');

		expect(paperEntry).not.toContain('tactile');
		expect(tactileEntry).not.toContain('paper');
	});
});
