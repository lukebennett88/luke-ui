import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

const dist = (file: string) => new URL(`../../../dist/${file}`, import.meta.url);

test('ships Vanilla Extract and StyleX rules in one stylesheet', async () => {
	const stylesheet = await readFile(dist('stylesheet.css'), 'utf8');
	expect(stylesheet).toContain('@layer reset');
	expect(stylesheet).toMatch(
		/@layer reset, theme, luke\.sx\.priority\d+(?:, luke\.sx\.priority\d+)*, recipes, structural, utilities;/,
	);
	expect(stylesheet).toMatch(/outline-color:\s*transparent/);
	expect(stylesheet).toMatch(/padding:\s*var\(--luke-space-sp16\)/);
});

test('appends StyleX rules to the shared stylesheet instead of a second file', () => {
	expect(existsSync(dist('stylesheet2.css'))).toBe(false);
	expect(existsSync(dist('stylex.css'))).toBe(false);
});

test('emits compiled StyleX JavaScript that loads in plain Node', () => {
	expect(() => {
		execFileSync(process.execPath, [fileURLToPath(dist('stylex-bundle.js'))], {
			encoding: 'utf8',
		});
	}).not.toThrow();
});
