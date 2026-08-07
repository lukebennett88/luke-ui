import { describe, expect, it } from 'vite-plus/test';
import { THEME_CLASS_NAME_PREFIX, themeClassName } from './theme-class-name.js';

describe('themeClassName', () => {
	it('rejects theme names that are not kebab-case', () => {
		expect(() => themeClassName('Tactile')).toThrow(/kebab-case/);
		expect(() => themeClassName('-leading')).toThrow(/kebab-case/);
		expect(() => themeClassName('double--hyphen')).toThrow(/kebab-case/);
		expect(() => themeClassName('9lives')).toThrow(/kebab-case/);
		expect(themeClassName('tactile')).toBe('luke-ui-theme-tactile');
	});

	it('builds the identity class from the shared prefix constant', () => {
		expect(THEME_CLASS_NAME_PREFIX).toBe('luke-ui-theme-');
		expect(themeClassName('tactile')).toBe(`${THEME_CLASS_NAME_PREFIX}tactile`);
	});
});
