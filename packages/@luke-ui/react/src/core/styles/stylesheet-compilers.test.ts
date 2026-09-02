import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

const dist = (file: string) => new URL(`../../../dist/${file}`, import.meta.url);

test('ships Vanilla Extract and StyleX rules in one stylesheet', async () => {
	const stylesheet = await readFile(dist('stylesheet.css'), 'utf8');
	expect(stylesheet.startsWith('@layer reset, theme, base, recipes.sx.priority')).toBe(true);
	expect(stylesheet).toMatch(
		/^@layer reset, theme, base, recipes\.sx\.priority\d+(?:, recipes\.sx\.priority\d+)*, components, utilities;/m,
	);
	expect(stylesheet).toMatch(/@layer recipes\.sx\.priority\d+/);
	// These two declarations come from Blockquote's real StyleX recipe (`blockquote/recipe.ts`),
	// not a fixture: a plain declaration and one that resolves to a `var(--luke-*)` token.
	// (StyleX doesn't support the `borderInlineStart` shorthand, so the recipe authors it as
	// longhands; `border-inline-start-width` is the plain declaration here.)
	expect(stylesheet).toMatch(/border-inline-start-width:\s*3px/);
	expect(stylesheet).toMatch(/border-inline-start-color:\s*var\(--luke-color-border-decorative\)/);
	expect(stylesheet).toMatch(/padding-inline-start:\s*var\(--luke-space-sp16\)/);
});

test('appends StyleX rules to the shared stylesheet instead of a second file', () => {
	expect(existsSync(dist('stylesheet2.css'))).toBe(false);
	expect(existsSync(dist('stylex.css'))).toBe(false);
});
