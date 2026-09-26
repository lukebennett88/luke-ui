/**
 * The pure, dependency-free pieces of the theme prefs logic. `theme-prefs.ts` and
 * `theme-prefs-script.ts` both import from here so the store and the pre-paint head script keep
 * one implementation. This module must keep importing nothing else: `theme-prefs-script.ts` is
 * compiled to a standalone IIFE by `vp pack`, and pulling in `@luke-ui/react/themes/*` here would
 * drag the theme compiler and its CSS into that bundle. `theme-identity-class-names.test.ts` checks
 * `THEME_IDENTITY_CLASS_NAMES` against the real theme packages' `themeClassName`.
 */

export type ThemeIdentity = 'paper' | 'tactile';
type ColorMode = 'light' | 'dark';
export type ColorModePreference = ColorMode | 'system';

/** Docs theme preferences, stored in `localStorage`. */
export interface ThemePrefs {
	colorModePreference: ColorModePreference;
	themeIdentity: ThemeIdentity;
}

export const THEME_IDENTITY_STORAGE_KEY = 'luke-ui-docs-theme';
export const COLOR_MODE_STORAGE_KEY = 'luke-ui-docs-color-mode';

/** Each theme identity's class name, `luke-ui-theme-${identity}`. */
export const THEME_IDENTITY_CLASS_NAMES: Record<ThemeIdentity, string> = {
	paper: 'luke-ui-theme-paper',
	tactile: 'luke-ui-theme-tactile',
};

/** Parses stored values, treating a missing or unknown value as the default. */
export function parseThemePrefs(
	themeIdentity: string | null,
	colorMode: string | null,
): ThemePrefs {
	return {
		colorModePreference: colorMode === 'light' || colorMode === 'dark' ? colorMode : 'system',
		themeIdentity: themeIdentity === 'paper' ? 'paper' : 'tactile',
	};
}

/**
 * Sets the identity class and colour mode on `root`. Fumadocs styles key off the `light`/`dark`
 * class; Luke UI keys off `data-color-mode`.
 */
export function applyThemePrefs(
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
