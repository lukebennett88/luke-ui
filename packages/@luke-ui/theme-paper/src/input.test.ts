import { defineTheme } from '@luke-ui/react/theme/compiler';
import { expect, test } from 'vite-plus/test';
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
	test(`emits a literal ${role} on-solid colour in every mode block`, () => {
		const css = defineTheme(theme);
		const values = declaredValues(css, `--luke-color-foreground-${role}-on-solid`);

		// Light, the dark media query, and the explicit dark mode each declare the colour.
		expect(values.length).toBeGreaterThanOrEqual(3);
		expect(css).not.toContain(`--luke-color-foreground-${role}-on-solid-primary`);
		expect(css).not.toContain(`--luke-color-foreground-${role}-on-solid-secondary`);
		for (const value of values) expect(value).not.toContain('var(');
	});
}
