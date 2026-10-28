import { defineTheme, ThemeInteractionTintError } from '@luke-ui/react/theme/compiler';
import { describe, expect, test } from 'vite-plus/test';
import { theme } from './input.js';

const ROLES = ['neutral', 'accent', 'info', 'success', 'warning', 'danger'] as const;

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

describe('custom canvases composed from the published input', () => {
	for (const { mode, base } of [
		{
			mode: 'light',
			base: 'oklch(0.94 0 30)',
		},
		{
			mode: 'dark',
			base: 'oklch(0.28 0 30)',
		},
	] as const) {
		test(`rejects the ${mode} canvas when it makes the theme unsatisfiable`, () => {
			let caught: unknown;
			try {
				defineTheme({
					...theme,
					name: `tactile-custom-${mode}`,
					color: { ...theme.color, surface: { ...theme.color.surface, base: { [mode]: base } } },
				});
			} catch (error) {
				caught = error;
			}

			if (mode === 'dark') {
				if (!(caught instanceof Error) || !caught.message.includes('unsatisfiable in dark')) {
					throw new Error(`Expected an unsatisfiable dark theme error, received ${String(caught)}`);
				}
				return;
			}

			expect(caught).toBeInstanceOf(ThemeInteractionTintError);
		});
	}
});
