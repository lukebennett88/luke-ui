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

describe('getThemeClassName', () => {
	it('prefixes a kebab-case name', () => {
		for (const name of VALID_NAMES) {
			expect(getThemeClassName(name)).toBe(`luke-ui-theme-${name}`);
		}
	});

	it('rejects a name that is not kebab-case', () => {
		for (const name of INVALID_NAMES) {
			expect(() => getThemeClassName(name)).toThrow(/kebab-case/);
			expect(() => defineTheme({ ...tactileTheme, name })).toThrow(/kebab-case/);
		}
	});
});
