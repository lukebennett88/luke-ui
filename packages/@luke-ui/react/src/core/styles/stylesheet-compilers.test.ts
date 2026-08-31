import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

const dist = (file: string) => new URL(`../../../dist/${file}`, import.meta.url);

test('ships Vanilla Extract rules in the shared stylesheet', async () => {
	const stylesheet = await readFile(dist('stylesheet.css'), 'utf8');
	expect(stylesheet).toContain('@layer reset');
});

test('appends StyleX rules to the shared stylesheet instead of a second file', () => {
	expect(existsSync(dist('stylesheet2.css'))).toBe(false);
	expect(existsSync(dist('stylex.css'))).toBe(false);
});
