import { themeClassName as paperThemeClassName } from '@luke-ui/react/themes/paper';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';

export type ThemeIdentity = 'paper' | 'tactile';
type ColorMode = 'light' | 'dark';
export type ColorModePreference = ColorMode | 'system';

/** Docs theme preferences, stored in `localStorage`. */
export interface ThemePrefs {
	colorModePreference: ColorModePreference;
	themeIdentity: ThemeIdentity;
}

export interface ThemePrefsSnapshot extends ThemePrefs {
	/** `colorModePreference`, with `system` resolved from `prefers-color-scheme`. */
	resolvedColorMode: ColorMode;
}

export const THEME_IDENTITY_STORAGE_KEY = 'luke-ui-docs-theme';
export const COLOR_MODE_STORAGE_KEY = 'luke-ui-docs-color-mode';

/**
 * Inline `<head>` script that applies the stored prefs to `<html>` before first paint. Storage
 * failures leave the defaults.
 */
export const themePrefsScript = `try{(${applyThemePrefs.toString()})(document.documentElement,(${parseThemePrefs.toString()})(localStorage.getItem(${JSON.stringify(THEME_IDENTITY_STORAGE_KEY)}),localStorage.getItem(${JSON.stringify(COLOR_MODE_STORAGE_KEY)})),${JSON.stringify(getThemeIdentityClassNames())})}catch(e){}`;

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
		window.matchMedia(DARK_COLOR_SCHEME_QUERY).addEventListener('change', emitChange);
	}
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
		if (listeners.size > 0) return;
		window.removeEventListener('storage', handleStorage);
		window.matchMedia(DARK_COLOR_SCHEME_QUERY).removeEventListener('change', emitChange);
	};
}

/**
 * Parses stored values, treating a missing or unknown value as the default. Self-contained, because
 * `themePrefsScript` inlines its source.
 */
export function parseThemePrefs(
	themeIdentity: string | null,
	colorMode: string | null,
): ThemePrefs {
	return {
		colorModePreference: colorMode === 'light' || colorMode === 'dark' ? colorMode : 'system',
		themeIdentity: themeIdentity === 'paper' ? 'paper' : 'tactile',
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

/**
 * Sets the identity class and colour mode on `root`. Fumadocs styles key off the `light`/`dark`
 * class; Luke UI keys off `data-color-mode`. Self-contained, because `themePrefsScript` inlines its
 * source.
 */
function applyThemePrefs(
	root: HTMLElement,
	prefs: ThemePrefs,
	identityClassNames: Record<ThemeIdentity, string>,
) {
	const systemColorMode = window.matchMedia('(prefers-color-scheme: dark)').matches
		? 'dark'
		: 'light';
	const colorMode =
		prefs.colorModePreference === 'system' ? systemColorMode : prefs.colorModePreference;
	for (const [identity, className] of Object.entries(identityClassNames)) {
		root.classList.toggle(className, identity === prefs.themeIdentity);
	}
	root.classList.toggle('light', colorMode === 'light');
	root.classList.toggle('dark', colorMode === 'dark');
	root.dataset.colorMode = colorMode;
	root.style.colorScheme = colorMode;
}
