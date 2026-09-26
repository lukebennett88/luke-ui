import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server';
import type { ThemePrefs, ThemePrefsUpdate } from './theme-prefs.js';
import {
	COLOR_MODE_COOKIE_NAME,
	COLOR_SCHEME_HINT_COOKIE_NAME,
	parseThemePrefs,
	THEME_IDENTITY_COOKIE_NAME,
} from './theme-prefs.js';

const COOKIE_OPTIONS = {
	maxAge: 60 * 60 * 24 * 365,
	path: '/',
	sameSite: 'lax',
} as const;

export function readThemePrefs(): ThemePrefs {
	return parseThemePrefs({
		colorMode: getCookie(COLOR_MODE_COOKIE_NAME),
		colorSchemeHint: getCookie(COLOR_SCHEME_HINT_COOKIE_NAME),
		themeIdentity: getCookie(THEME_IDENTITY_COOKIE_NAME),
	});
}

export function writeThemePrefs({ colorModePreference, themeIdentity }: ThemePrefsUpdate) {
	if (themeIdentity) setCookie(THEME_IDENTITY_COOKIE_NAME, themeIdentity, COOKIE_OPTIONS);
	if (colorModePreference === 'system') {
		deleteCookie(COLOR_MODE_COOKIE_NAME, { path: '/' });
	} else if (colorModePreference) {
		setCookie(COLOR_MODE_COOKIE_NAME, colorModePreference, COOKIE_OPTIONS);
	}
}
