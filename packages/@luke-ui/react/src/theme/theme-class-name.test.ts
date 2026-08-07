import { describe, expect, it } from 'vite-plus/test';
import { defineTheme } from './define-theme.js';
import { tactileTheme } from './foundations/tactile.js';
import { getThemeClassName } from './theme-class-name.js';

const VALID_NAMES = ['tactile', 'high-contrast', 'brand-v2', 'a1'];

const INVALID_NAMES = [
	'Tactile',
	'-leading',
	'trailing-',
	'double--hyphen',
	'9lives',
	'',
	'has space',
	'snake_case',
];

/**
 * The message `getThemeClassName` rejects `name` with. Throws when the name is accepted, so a name
 * that stops being invalid fails the test instead of silently asserting nothing.
 */
function kebabCaseError(name: string): string {
	try {
		getThemeClassName(name);
	} catch (error) {
		if (error instanceof Error) return error.message;
	}
	throw new Error(`expected getThemeClassName to reject "${name}"`);
}

describe('getThemeClassName', () => {
	it('prefixes a kebab-case name', () => {
		for (const name of VALID_NAMES) {
			expect(getThemeClassName(name)).toBe(`luke-ui-theme-${name}`);
		}
	});

	it('rejects a name that is not kebab-case', () => {
		for (const name of INVALID_NAMES) {
			expect(() => getThemeClassName(name)).toThrow(/kebab-case/);
		}
	});

	// Pins the two surfaces together: an author can only reach a theme's class through this helper,
	// so a name `defineTheme` accepts but the helper rejects would compile a stylesheet no identity
	// class can select. Asserting on the identical message text, not just that both throw.
	it('rejects the same names defineTheme does, with the same message', () => {
		for (const name of INVALID_NAMES) {
			expect(() => defineTheme({ ...tactileTheme, name })).toThrow(kebabCaseError(name));
		}
	});
});
