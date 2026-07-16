import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vite-plus/test';
import packageJson from '../../package.json' with { type: 'json' };
import { paperThemeClassName, tactileThemeClassName } from './index.js';

const themeArtifacts = {
	paper: new URL('../../dist/themes/paper.css', import.meta.url),
	tactile: new URL('../../dist/themes/tactile.css', import.meta.url),
} as const;

describe('bundled theme artifacts', () => {
	it('exports each generated stylesheet as an independent package entrypoint', async () => {
		const paperCss = await readFile(themeArtifacts.paper, 'utf8');
		const tactileCss = await readFile(themeArtifacts.tactile, 'utf8');

		expect(packageJson.exports['./themes/paper.css']).toBe('./dist/themes/paper.css');
		expect(packageJson.exports['./themes/tactile.css']).toBe('./dist/themes/tactile.css');
		expect(paperCss).toContain(`.${paperThemeClassName} {`);
		expect(paperCss).not.toContain(tactileThemeClassName);
		expect(tactileCss).toContain(`.${tactileThemeClassName} {`);
		expect(tactileCss).not.toContain(paperThemeClassName);
	});
});
