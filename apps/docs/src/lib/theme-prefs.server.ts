import { getCookie } from '@tanstack/react-start/server';
import type { ThemePrefs } from './theme-prefs.js';
import {
	COLOR_MODE_COOKIE_NAME,
	parseColorMode,
	parseThemeIdentity,
	THEME_IDENTITY_COOKIE_NAME,
} from './theme-prefs.js';

/** Read docs theme prefs from request cookies. Call only inside a server function. */
export function readThemePrefsFromCookies(): ThemePrefs {
	return {
		colorMode: parseColorMode(getCookie(COLOR_MODE_COOKIE_NAME)),
		themeIdentity: parseThemeIdentity(getCookie(THEME_IDENTITY_COOKIE_NAME)),
	};
}
