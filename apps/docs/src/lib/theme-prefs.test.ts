import { expect, test } from 'vite-plus/test';
import { parseThemePrefs } from './theme-prefs.js';

test('reads stored prefs', () => {
	expect(parseThemePrefs('paper', 'dark')).toEqual({
		colorModePreference: 'dark',
		themeIdentity: 'paper',
	});
});

test('treats missing or unknown values as the defaults', () => {
	const defaults = { colorModePreference: 'system', themeIdentity: 'tactile' };
	expect(parseThemePrefs(null, null)).toEqual(defaults);
	expect(parseThemePrefs('glass', 'sepia')).toEqual(defaults);
});
