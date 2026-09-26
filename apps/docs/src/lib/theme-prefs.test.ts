import { themeClassName as paperThemeClassName } from '@luke-ui/react/themes/paper';
import { expect, test } from 'vite-plus/test';
import {
	COLOR_MODE_COOKIE_NAME,
	DEFAULT_COLOR_MODE,
	DEFAULT_THEME_IDENTITY,
	parseColorMode,
	parseThemeIdentity,
	THEME_IDENTITY_COOKIE_NAME,
	themeIdentityClassName,
	themePrefsBootstrapScript,
} from './theme-prefs.js';

test('parseThemeIdentity accepts only paper; everything else is tactile', () => {
	expect(parseThemeIdentity('paper')).toBe('paper');
	expect(parseThemeIdentity('tactile')).toBe(DEFAULT_THEME_IDENTITY);
	expect(parseThemeIdentity('nope')).toBe(DEFAULT_THEME_IDENTITY);
	expect(parseThemeIdentity(undefined)).toBe(DEFAULT_THEME_IDENTITY);
});

test('parseColorMode accepts light, dark, and system', () => {
	expect(parseColorMode('light')).toBe('light');
	expect(parseColorMode('dark')).toBe('dark');
	expect(parseColorMode('system')).toBe('system');
	expect(parseColorMode('sepia')).toBe(DEFAULT_COLOR_MODE);
	expect(parseColorMode(undefined)).toBe(DEFAULT_COLOR_MODE);
});

test('themeIdentityClassName maps each identity to its bundled class', () => {
	expect(themeIdentityClassName('paper')).toBe(paperThemeClassName);
	expect(themeIdentityClassName('tactile')).not.toBe(paperThemeClassName);
});

test('bootstrap script names the preference cookies and identity classes', () => {
	expect(themePrefsBootstrapScript).toContain(THEME_IDENTITY_COOKIE_NAME);
	expect(themePrefsBootstrapScript).toContain(COLOR_MODE_COOKIE_NAME);
	expect(themePrefsBootstrapScript).toContain(paperThemeClassName);
});
