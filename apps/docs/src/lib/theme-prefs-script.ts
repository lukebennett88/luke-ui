/**
 * Applies the stored theme prefs to `<html>` before first paint. A storage read failure falls back
 * to the defaults; the prefs are always applied, so a failure still resolves `system` from
 * `prefers-color-scheme` and sets the `<html>` classes and attributes.
 *
 * Compiled by `vp pack` (tsdown, IIFE, minified) into `src/generated/theme-prefs-script.iife.js`
 * during `docs#generate`, then inlined via a `?raw` import in `__root.tsx` and rendered as an inline
 * `<head>` script.
 */

import {
	applyThemePrefs,
	COLOR_MODE_STORAGE_KEY,
	parseThemePrefs,
	THEME_IDENTITY_CLASS_NAMES,
	THEME_IDENTITY_STORAGE_KEY,
} from './theme-prefs-shared.js';

let themeIdentity: string | null = null;
let colorMode: string | null = null;
try {
	themeIdentity = localStorage.getItem(THEME_IDENTITY_STORAGE_KEY);
	colorMode = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
} catch {
	// Storage can be unavailable, for example in some private windows.
}
applyThemePrefs(
	document.documentElement,
	parseThemePrefs(themeIdentity, colorMode),
	THEME_IDENTITY_CLASS_NAMES,
);
