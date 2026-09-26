import { expect, test } from 'vite-plus/test';
import { parseThemePrefs } from './theme-prefs.js';

test('defaults to Tactile and a light system colour mode without cookies', () => {
	expect(
		parseThemePrefs({ colorMode: undefined, colorSchemeHint: undefined, themeIdentity: undefined }),
	).toEqual({
		colorModePreference: 'system',
		resolvedColorMode: 'light',
		themeIdentity: 'tactile',
	});
});

test('reads explicit preferences and ignores unknown values', () => {
	expect(
		parseThemePrefs({ colorMode: 'dark', colorSchemeHint: 'light', themeIdentity: 'paper' }),
	).toEqual({ colorModePreference: 'dark', resolvedColorMode: 'dark', themeIdentity: 'paper' });
	expect(
		parseThemePrefs({ colorMode: 'sepia', colorSchemeHint: 'dark', themeIdentity: 'glass' }),
	).toEqual({ colorModePreference: 'system', resolvedColorMode: 'dark', themeIdentity: 'tactile' });
});

test('resolves the system preference from the client hint', () => {
	expect(
		parseThemePrefs({ colorMode: undefined, colorSchemeHint: 'dark', themeIdentity: undefined })
			.resolvedColorMode,
	).toBe('dark');
});
