import { themeClassName as paperThemeClassName } from '@luke-ui/react/themes/paper';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';
import {
	COLOR_MODE_COOKIE_NAME,
	COLOR_MODE_STORAGE_KEY,
	DEFAULT_COLOR_MODE,
	DEFAULT_THEME_IDENTITY,
	THEME_IDENTITY_COOKIE_NAME,
	THEME_PREFS_COOKIE_MAX_AGE_SECONDS,
} from './theme-prefs-constants.js';
import type { ColorModePreference, ThemeIdentity, ThemePrefs } from './theme-prefs-constants.js';

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

function readDocumentCookie(name: string): string | undefined {
	const prefix = `${name}=`;
	for (const part of document.cookie.split('; ')) {
		if (part.startsWith(prefix)) return decodeURIComponent(part.slice(prefix.length));
	}
	return undefined;
}

export function readThemeIdentityPreference(): ThemeIdentity {
	return parseThemeIdentity(readDocumentCookie(THEME_IDENTITY_COOKIE_NAME));
}

export function readColorModePreference(): ColorModePreference {
	return parseColorMode(readDocumentCookie(COLOR_MODE_COOKIE_NAME));
}

export function writeThemeIdentityPreference(themeIdentity: ThemeIdentity) {
	writeDocumentCookie(THEME_IDENTITY_COOKIE_NAME, themeIdentity);
	window.dispatchEvent(new Event(THEME_IDENTITY_CHANGE_EVENT));
}

export function writeColorModePreference(colorMode: ColorModePreference) {
	writeDocumentCookie(COLOR_MODE_COOKIE_NAME, colorMode);
	// Keep next-themes' blocking script aligned with the cookie the server reads.
	localStorage.setItem(COLOR_MODE_STORAGE_KEY, colorMode);
	window.dispatchEvent(new Event(COLOR_MODE_CHANGE_EVENT));
}

export function subscribeToThemeIdentityPreference(onStoreChange: () => void) {
	window.addEventListener(THEME_IDENTITY_CHANGE_EVENT, onStoreChange);
	return () => {
		window.removeEventListener(THEME_IDENTITY_CHANGE_EVENT, onStoreChange);
	};
}

export function subscribeToColorModePreference(onStoreChange: () => void) {
	window.addEventListener(COLOR_MODE_CHANGE_EVENT, onStoreChange);
	return () => {
		window.removeEventListener(COLOR_MODE_CHANGE_EVENT, onStoreChange);
	};
}

function writeDocumentCookie(name: string, value: string) {
	document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${THEME_PREFS_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
