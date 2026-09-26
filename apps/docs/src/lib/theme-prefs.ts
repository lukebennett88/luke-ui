import { themeClassName as paperThemeClassName } from '@luke-ui/react/themes/paper';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';
import {
	COLOR_MODE_COOKIE_NAME,
	COLOR_MODE_STORAGE_KEY,
	DEFAULT_COLOR_MODE,
	DEFAULT_THEME_IDENTITY,
	THEME_IDENTITY_COOKIE_NAME,
} from './theme-prefs-constants.js';
import type { ColorModePreference, ThemeIdentity, ThemePrefs } from './theme-prefs-constants.js';
import { readPrefsCookie, writePrefsCookie } from './theme-prefs-cookie.js';

export type { ColorModePreference, ThemeIdentity, ThemePrefs };
export {
	COLOR_MODE_COOKIE_NAME,
	COLOR_MODE_STORAGE_KEY,
	DEFAULT_COLOR_MODE,
	DEFAULT_THEME_IDENTITY,
	THEME_IDENTITY_COOKIE_NAME,
} from './theme-prefs-constants.js';

export const DEFAULT_THEME_PREFS = {
	colorMode: DEFAULT_COLOR_MODE,
	themeIdentity: DEFAULT_THEME_IDENTITY,
} as const satisfies ThemePrefs;

const THEME_IDENTITY_CLASS_NAMES = {
	paper: paperThemeClassName,
	tactile: tactileThemeClassName,
} as const satisfies Record<ThemeIdentity, string>;

const THEME_IDENTITY_CHANGE_EVENT = 'luke-ui-docs-theme-change';
const COLOR_MODE_CHANGE_EVENT = 'luke-ui-docs-color-mode-change';

export function parseThemeIdentity(value: string | null | undefined): ThemeIdentity {
	return value === 'paper' ? 'paper' : DEFAULT_THEME_IDENTITY;
}

export function parseColorMode(value: string | null | undefined): ColorModePreference {
	return value === 'light' || value === 'dark' || value === 'system' ? value : DEFAULT_COLOR_MODE;
}

export function themeIdentityClassName(themeIdentity: ThemeIdentity): string {
	return THEME_IDENTITY_CLASS_NAMES[themeIdentity];
}

export function readThemeIdentityPreference(): ThemeIdentity {
	// localStorage wins on the client so `storage` events from other tabs are visible.
	return parseThemeIdentity(
		localStorage.getItem(THEME_IDENTITY_COOKIE_NAME) ??
			readPrefsCookie(THEME_IDENTITY_COOKIE_NAME) ??
			undefined,
	);
}

export function readColorModePreference(): ColorModePreference {
	return parseColorMode(readPrefsCookie(COLOR_MODE_COOKIE_NAME));
}

export function writeThemeIdentityPreference(themeIdentity: ThemeIdentity) {
	writePrefsCookie(THEME_IDENTITY_COOKIE_NAME, themeIdentity);
	// Dual-write for cross-tab sync via the `storage` event (cookies are not observable that way).
	localStorage.setItem(THEME_IDENTITY_COOKIE_NAME, themeIdentity);
	window.dispatchEvent(new Event(THEME_IDENTITY_CHANGE_EVENT));
}

export function writeColorModePreference(colorMode: ColorModePreference) {
	writePrefsCookie(COLOR_MODE_COOKIE_NAME, colorMode);
	// Keep next-themes' blocking script aligned with the cookie the server reads.
	localStorage.setItem(COLOR_MODE_STORAGE_KEY, colorMode);
	window.dispatchEvent(new Event(COLOR_MODE_CHANGE_EVENT));
}

export function subscribeToThemeIdentityPreference(onStoreChange: () => void) {
	const handleStorage = (event: StorageEvent) => {
		if (event.key !== THEME_IDENTITY_COOKIE_NAME) return;
		if (event.newValue === 'paper' || event.newValue === 'tactile') {
			// Keep this tab's SSR cookie aligned with the other tab's preference.
			writePrefsCookie(THEME_IDENTITY_COOKIE_NAME, event.newValue);
		}
		onStoreChange();
	};

	window.addEventListener('storage', handleStorage);
	window.addEventListener(THEME_IDENTITY_CHANGE_EVENT, onStoreChange);
	return () => {
		window.removeEventListener('storage', handleStorage);
		window.removeEventListener(THEME_IDENTITY_CHANGE_EVENT, onStoreChange);
	};
}

export function subscribeToColorModePreference(onStoreChange: () => void) {
	window.addEventListener(COLOR_MODE_CHANGE_EVENT, onStoreChange);
	return () => {
		window.removeEventListener(COLOR_MODE_CHANGE_EVENT, onStoreChange);
	};
}
