import { themeClassName as paperThemeClassName } from '@luke-ui/react/themes/paper';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';
import { expect, test } from 'vite-plus/test';
import themePrefsBootstrapScript from '../generated/theme-prefs-bootstrap-script.iife.js?raw';
import { THEME_IDENTITY_BOOTSTRAP_CLASS_NAMES } from './theme-prefs-constants.js';
import {
	COLOR_MODE_COOKIE_NAME,
	DEFAULT_COLOR_MODE,
	DEFAULT_THEME_IDENTITY,
	parseColorMode,
	parseThemeIdentity,
	THEME_IDENTITY_COOKIE_NAME,
	themeIdentityClassName,
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
	expect(themeIdentityClassName('tactile')).toBe(tactileThemeClassName);
});

test('bootstrap class names stay aligned with the bundled theme packages', () => {
	expect(THEME_IDENTITY_BOOTSTRAP_CLASS_NAMES.paper).toBe(paperThemeClassName);
	expect(THEME_IDENTITY_BOOTSTRAP_CLASS_NAMES.tactile).toBe(tactileThemeClassName);
});

test('bootstrap IIFE names the preference cookies and identity classes', () => {
	expect(themePrefsBootstrapScript).toContain(THEME_IDENTITY_COOKIE_NAME);
	expect(themePrefsBootstrapScript).toContain(COLOR_MODE_COOKIE_NAME);
	expect(themePrefsBootstrapScript).toContain(THEME_IDENTITY_BOOTSTRAP_CLASS_NAMES.paper);
	expect(themePrefsBootstrapScript).toContain(THEME_IDENTITY_BOOTSTRAP_CLASS_NAMES.tactile);
});
