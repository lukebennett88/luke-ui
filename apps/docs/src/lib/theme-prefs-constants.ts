export type ThemeIdentity = 'paper' | 'tactile';
export type ColorModePreference = 'light' | 'dark' | 'system';

export interface ThemePrefs {
	colorMode: ColorModePreference;
	themeIdentity: ThemeIdentity;
}

/** Cookie + legacy localStorage key for Paper/Tactile identity. */
export const THEME_IDENTITY_COOKIE_NAME = 'luke-ui-docs-theme';

/** Cookie for the docs colour-mode preference. */
export const COLOR_MODE_COOKIE_NAME = 'luke-ui-docs-color-mode';

/** next-themes default `storageKey`; dual-written so its bootstrap script stays in sync. */
export const COLOR_MODE_STORAGE_KEY = 'theme';

export const DEFAULT_THEME_IDENTITY = 'tactile' satisfies ThemeIdentity;
export const DEFAULT_COLOR_MODE = 'system' satisfies ColorModePreference;

/** Shared with the pre-hydration bootstrap IIFE so cookie lifetime stays aligned. */
export const THEME_PREFS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Identity classes applied by the bootstrap IIFE. Must match
 * `themeIdentityClassName` from the bundled theme packages.
 */
export const THEME_IDENTITY_BOOTSTRAP_CLASS_NAMES = {
	paper: 'luke-ui-theme-paper',
	tactile: 'luke-ui-theme-tactile',
} as const satisfies Record<ThemeIdentity, string>;
