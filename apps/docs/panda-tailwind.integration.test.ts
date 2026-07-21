import { execFile } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { readdir, readFile } from 'node:fs/promises';
import { build } from 'vite';
import { expect, test } from 'vite-plus/test';

const execFileAsync = promisify(execFile);
const docsRoot = fileURLToPath(new URL('.', import.meta.url));

test('builds the docs app with Panda and Tailwind using the public preset', async () => {
	await execFileAsync(
		join(docsRoot, 'node_modules/.bin/panda'),
		['codegen', '--config', 'panda.config.ts'],
		{ cwd: docsRoot },
	);
	await build({ root: docsRoot });

	const [appCss, outputCss] = await Promise.all([
		readFile(join(docsRoot, 'src/styles/app.css'), 'utf8'),
		readCssFiles(join(docsRoot, 'dist/client')),
	]);

	expect(
		appCss.startsWith('@layer reset, theme, base, tokens, recipes, box, components, utilities;'),
	).toBe(true);
	expect(appCss).toContain("@import '@luke-ui/react/stylesheet.css';");
	expect(appCss).toContain("@import 'tailwindcss';");
	const emittedLayerOrder = [...outputCss.matchAll(/@layer ([a-z][a-z0-9]*)[;{]/g)]
		.map((match) => match[1])
		.filter((name, index, all) => all.indexOf(name) === index)
		.filter((name) => name !== 'properties');
	expect(emittedLayerOrder).toEqual([
		'reset',
		'theme',
		'base',
		'tokens',
		'recipes',
		'box',
		'components',
		'utilities',
	]);
	expect(outputCss).toContain('display:flex');
	expect(outputCss).toMatch(/\.c_text\\\.primary\s*\{\s*color:var\(--colors-text-primary\)/);
	// Prove the docs' OWN css() atomics are emitted — i.e. the Panda PostCSS pass
	// actually ran alongside Tailwind, not just that the DS stylesheet was bundled.
	// These come from theme-controls' <select> and the DocsTitle line-height.
	expect(outputCss).toContain('min-block-size:var(--luke-control-size-small)');
	expect(outputCss).toContain('border-color:var(--luke-color-border-control)');
	expect(outputCss).toContain('line-height:var(--luke-font-700-line-height)');
}, 120_000);

async function readCssFiles(dir: string): Promise<string> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const path = join(dir, entry.name);
			if (entry.isDirectory()) return readCssFiles(path);
			return entry.name.endsWith('.css') ? readFile(path, 'utf8') : '';
		}),
	);
	return files.join('');
}
