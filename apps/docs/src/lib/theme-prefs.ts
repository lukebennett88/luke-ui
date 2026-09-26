import { themeClassName as paperThemeClassName } from '@luke-ui/react/themes/paper';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';
import type { ColorModePreference, ThemeIdentity, ThemePrefs } from './theme-prefs-shared.js';
import {
	applyThemePrefs,
	COLOR_MODE_STORAGE_KEY,
	parseThemePrefs,
	THEME_IDENTITY_STORAGE_KEY,
} from './theme-prefs-shared.js';

export type { ColorModePreference, ThemeIdentity, ThemePrefs } from './theme-prefs-shared.js';
export {
	COLOR_MODE_STORAGE_KEY,
	parseThemePrefs,
	THEME_IDENTITY_STORAGE_KEY,
} from './theme-prefs-shared.js';

type ColorMode = 'light' | 'dark';

export interface ThemePrefsSnapshot extends ThemePrefs {
	/** `colorModePreference`, with `system` resolved from `prefers-color-scheme`. */
	resolvedColorMode: ColorMode;
}

/** Reads the stored prefs. Returns the same object until the prefs or system colour mode change. */
export function getThemePrefsSnapshot(): ThemePrefsSnapshot {
	const prefs = previewPrefs ?? readStoredThemePrefs();
	const resolvedColorMode = resolveColorMode(prefs.colorModePreference);
	if (
		snapshot.colorModePreference !== prefs.colorModePreference ||
		snapshot.themeIdentity !== prefs.themeIdentity ||
		snapshot.resolvedColorMode !== resolvedColorMode
	) {
		snapshot = { ...prefs, resolvedColorMode };
	}
	return snapshot;
}

/** The prefs a static render uses. The head script applies the stored prefs before paint. */
export function getServerThemePrefsSnapshot(): ThemePrefsSnapshot {
	return SERVER_SNAPSHOT;
}

/** Stores a pref change and applies it to `<html>`. A failed write keeps the stored prefs. */
export function writeThemePrefs(update: Partial<ThemePrefs>) {
	try {
		if (update.themeIdentity) {
			localStorage.setItem(THEME_IDENTITY_STORAGE_KEY, update.themeIdentity);
		}
		if (update.colorModePreference) {
			localStorage.setItem(COLOR_MODE_STORAGE_KEY, update.colorModePreference);
		}
	} catch {
		// Storage can be unavailable, for example in some private windows.
	}
	emitChange();
}

/**
 * Applies prefs to this document without storing them, overriding the stored prefs. The playground
 * preview mirrors its parent page this way.
 */
export function previewThemePrefs(prefs: ThemePrefs) {
	previewPrefs = prefs;
	emitChange();
}

/** Follows pref changes from this tab, other tabs, and the system colour mode. */
export function subscribeToThemePrefs(listener: () => void) {
	if (listeners.size === 0) {
		window.addEventListener('storage', handleStorage);
		darkColorSchemeQuery = window.matchMedia(DARK_COLOR_SCHEME_QUERY);
		darkColorSchemeQuery.addEventListener('change', emitChange);
	}
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
		if (listeners.size > 0) return;
		window.removeEventListener('storage', handleStorage);
		darkColorSchemeQuery?.removeEventListener('change', emitChange);
		darkColorSchemeQuery = null;
	};
}

const DARK_COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';

const SERVER_SNAPSHOT: ThemePrefsSnapshot = {
	colorModePreference: 'system',
	resolvedColorMode: 'light',
	themeIdentity: 'tactile',
};

const listeners = new Set<() => void>();
let previewPrefs: ThemePrefs | null = null;
let snapshot = SERVER_SNAPSHOT;
/** The `MediaQueryList` holding the `change` listener while subscriptions are active. */
let darkColorSchemeQuery: MediaQueryList | null = null;

function readStoredThemePrefs(): ThemePrefs {
	try {
		return parseThemePrefs(
			localStorage.getItem(THEME_IDENTITY_STORAGE_KEY),
			localStorage.getItem(COLOR_MODE_STORAGE_KEY),
		);
	} catch {
		return parseThemePrefs(null, null);
	}
}

function resolveColorMode(colorModePreference: ColorModePreference): ColorMode {
	if (colorModePreference !== 'system') return colorModePreference;
	return window.matchMedia(DARK_COLOR_SCHEME_QUERY).matches ? 'dark' : 'light';
}

function emitChange() {
	applyThemePrefs(
		document.documentElement,
		previewPrefs ?? readStoredThemePrefs(),
		getThemeIdentityClassNames(),
	);
	for (const listener of listeners) listener();
}

function handleStorage(event: StorageEvent) {
	if (
		event.key === null ||
		event.key === THEME_IDENTITY_STORAGE_KEY ||
		event.key === COLOR_MODE_STORAGE_KEY
	) {
		emitChange();
	}
}

function getThemeIdentityClassNames(): Record<ThemeIdentity, string> {
	return { paper: paperThemeClassName, tactile: tactileThemeClassName };
}
