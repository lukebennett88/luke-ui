import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vite-plus/test';
import { generateTokenReference } from '../../scripts/generate-token-reference.js';
import { themeTokens } from '../generated/token-reference.generated.js';

test('emits a typed themeTokens array without MapLeafNodes', () => {
	const reference = generateTokenReference();

	expect(reference).toContain('export const themeTokens: ReadonlyArray<ThemeToken> = [');
	expect(reference).not.toContain('MapLeafNodes');
});

test('declares the family union the token entries are keyed by', () => {
	const reference = generateTokenReference();

	expect(reference).toContain('export type ThemeTokenFamily =');
	for (const family of new Set(themeTokens.map((token) => token.family))) {
		expect(reference).toContain(`| '${family}'`);
	}
});

test('emits the generated file on disk that the docs app imports', () => {
	const emitted = generateTokenReference();
	const emittedPath = resolve(import.meta.dirname, '../generated/token-reference.generated.ts');
	expect(readFileSync(emittedPath, 'utf8')).toBe(emitted);
});
