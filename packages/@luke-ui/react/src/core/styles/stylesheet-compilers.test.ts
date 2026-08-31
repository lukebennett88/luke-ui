import { access, readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';
import { stylexBoundary } from './stylex-boundary.js';

async function exists(url: URL): Promise<boolean> {
	try {
		await access(url);
		return true;
	} catch {
		return false;
	}
}

test('ships Vanilla Extract and StyleX rules in one stylesheet', async () => {
	const stylesheet = await readFile(
		new URL('../../../dist/stylesheet.css', import.meta.url),
		'utf8',
	);

	// Vanilla Extract emits the named cascade layers; StyleX emits its own atomic class after
	// the boundary comment the build writes between them.
	const [vanillaExtract, stylex] = stylesheet.split(stylexBoundary);
	expect(vanillaExtract).toContain('@layer reset');
	expect(stylex).toMatch(/outline-color:\s*transparent/);
});

test('appends StyleX rules to the shared stylesheet instead of a second file', async () => {
	expect(await exists(new URL('../../../dist/stylesheet2.css', import.meta.url))).toBe(false);
	expect(await exists(new URL('../../../dist/stylex.css', import.meta.url))).toBe(false);
});
