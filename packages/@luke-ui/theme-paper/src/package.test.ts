import { fromFile } from '@capsizecss/unpack/fs';
import { getThemeClassName } from '@luke-ui/react/theme';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';
import { themeClassName } from './index.js';
import { theme } from './input.js';

const FONT_WEIGHT_PATTERN = /font-weight:\s*(\d+)\s+(\d+);/;
const STATIC_IMPORT_PATTERN = /(?:^|\n)\s*(?:import|export)\b[^'"]*?from\s*["']([^"']+)["']/g;

const fontUrl = new URL('./fonts/inter-latin-wght-normal.woff2', import.meta.url);

test('names the identity class after the input', () => {
	expect(themeClassName).toBe(getThemeClassName(theme.name));
});

test('bundles metrics that match the bundled Inter file', async () => {
	const { ascent, capHeight, descent, familyName, lineGap, unitsPerEm } = await fromFile(
		fontUrl.pathname,
	);

	expect(theme.typography.fonts.body.metrics).toEqual({
		ascent,
		capHeight,
		descent,
		familyName,
		lineGap,
		unitsPerEm,
	});
});

test('declares a font-weight range that covers every theme weight', async () => {
	const css = await readFile(new URL('./fonts.css', import.meta.url), 'utf8');
	const match = FONT_WEIGHT_PATTERN.exec(css);

	expect(match?.slice(1).map(Number)).toEqual([100, 900]);
});

// The root entry must never reach the input or the compiler, so importing the class costs a
// consumer only the class. The packed-consumer harness checks the built entry the same way.
test('keeps the root entry apart from the input and the compiler', async () => {
	const source = await readFile(new URL('./index.ts', import.meta.url), 'utf8');
	const specifiers = [...source.matchAll(STATIC_IMPORT_PATTERN)].map((match) => match[1]);

	expect(new Set(specifiers)).toEqual(new Set(['./name.js', '@luke-ui/react/theme']));
});
