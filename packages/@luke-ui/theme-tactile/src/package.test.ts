import { fromFile } from '@capsizecss/unpack/fs';
import { getThemeClassName } from '@luke-ui/react/theme';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';
import { themeClassName } from './index.js';
import { theme } from './input.js';

const FONT_WEIGHT_PATTERN = /font-weight:\s*(\d+)\s+(\d+);/;

const fontUrl = new URL(
	import.meta.resolve('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'),
);

test('names the identity class after the input', () => {
	expect(themeClassName).toBe(getThemeClassName(theme.name));
});

test('bundles metrics that match the Inter file it ships', async () => {
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
