import { defineTheme, ThemeContrastError } from '@luke-ui/react/theme/compiler';
import { describe, expect, test } from 'vite-plus/test';
import { theme } from './input.js';

const ROLES = ['neutral', 'accent', 'info', 'success', 'warning', 'danger'] as const;
const REST_FOREGROUND_PATTERN = /^color\.foreground\.\w+\.rest$/;
const PRESSED_SUBTLE_BACKGROUND_PATTERN = /^color\.background\.\w+\.subtle\.pressed$/;

/** Every value the stylesheet assigns to `variable`, in source order. */
function declaredValues(css: string, variable: string): Array<string> {
	return [...css.matchAll(new RegExp(`${variable}: ([^;]+);`, 'g'))].map((match) => match[1]!);
}

test('the published input passes every hard contrast gate in both modes', () => {
	expect(() => defineTheme(theme)).not.toThrow();
});

for (const role of ROLES) {
	test(`emits identical literal ${role} on-solid hierarchy colours in every mode block`, () => {
		const css = defineTheme(theme);
		const primary = declaredValues(css, `--luke-color-foreground-${role}-on-solid-primary`);
		const secondary = declaredValues(css, `--luke-color-foreground-${role}-on-solid-secondary`);

		// Light, the dark media query, and the explicit dark mode each declare both leaves.
		expect(primary.length).toBeGreaterThanOrEqual(3);
		expect(secondary).toEqual(primary);
		for (const value of primary) expect(value).not.toContain('var(');
	});
}

describe('custom canvases that extend the published input', () => {
	for (const { mode, base, foreground, background, ratio } of [
		{
			mode: 'light',
			base: 'oklch(0.94 0 30)',
			foreground: 'color.foreground.success.rest',
			background: 'color.background.danger.subtle.pressed',
			ratio: 4.467,
		},
		{
			mode: 'dark',
			base: 'oklch(0.28 0 30)',
			foreground: 'color.foreground.danger.rest',
			background: 'color.background.success.subtle.pressed',
			ratio: 4.393,
		},
	] as const) {
		test(`rejects the ${mode} canvas only for cross-role subtle contrast`, () => {
			let caught: unknown;
			try {
				defineTheme({
					extends: theme,
					name: `tactile-custom-${mode}`,
					color: { surface: { base: { [mode]: base } } },
				});
			} catch (error) {
				caught = error;
			}

			expect(caught).toBeInstanceOf(ThemeContrastError);
			if (!(caught instanceof ThemeContrastError)) throw caught;
			expect(caught.failures).toContainEqual({
				mode,
				foreground,
				background,
				ratio: expect.closeTo(ratio, 3),
				required: 4.5,
			});
			for (const failure of caught.failures) {
				expect(failure.mode).toBe(mode);
				expect(failure.foreground).toMatch(REST_FOREGROUND_PATTERN);
				expect(failure.background).toMatch(PRESSED_SUBTLE_BACKGROUND_PATTERN);
				expect(failure.foreground.split('.')[2]).not.toBe(failure.background.split('.')[2]);
			}
		});
	}
});
