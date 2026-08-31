import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

const dist = (file: string) => new URL(`../../../dist/${file}`, import.meta.url);

test('ships Vanilla Extract and StyleX rules in one stylesheet', async () => {
	const stylesheet = await readFile(dist('stylesheet.css'), 'utf8');
	const [vanillaExtract, stylex] = stylesheet.split('/* stylex */');
	expect(vanillaExtract).toContain('@layer reset');
	expect(stylex).toMatch(/outline-color:\s*transparent/);
});

test('appends StyleX rules to the shared stylesheet instead of a second file', () => {
	expect(existsSync(dist('stylesheet2.css'))).toBe(false);
	expect(existsSync(dist('stylex.css'))).toBe(false);
});

test('emits compiled StyleX JavaScript that loads in plain Node', () => {
	expect(() => {
		execFileSync(process.execPath, [fileURLToPath(dist('stylex-fixture.js'))], {
			encoding: 'utf8',
		});
	}).not.toThrow();
});
