import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vite-plus/test';
import packageJson from '../../package.json' with { type: 'json' };
import { elmoThemeClassName, machinedEdgeThemeClassName } from './index.js';

const themeArtifacts = {
	elmo: new URL('../../dist/themes/elmo.css', import.meta.url),
	'machined-edge': new URL('../../dist/themes/machined-edge.css', import.meta.url),
} as const;

describe('bundled theme artifacts', () => {
	it('exports each generated stylesheet as an independent package entrypoint', async () => {
		const elmoCss = await readFile(themeArtifacts.elmo, 'utf8');
		const machinedEdgeCss = await readFile(themeArtifacts['machined-edge'], 'utf8');

		expect(packageJson.exports['./themes/elmo.css']).toBe('./dist/themes/elmo.css');
		expect(packageJson.exports['./themes/machined-edge.css']).toBe(
			'./dist/themes/machined-edge.css',
		);
		expect(elmoCss).toContain(`.${elmoThemeClassName} {`);
		expect(elmoCss).not.toContain(machinedEdgeThemeClassName);
		expect(machinedEdgeCss).toContain(`.${machinedEdgeThemeClassName} {`);
		expect(machinedEdgeCss).not.toContain(elmoThemeClassName);
	});
});
