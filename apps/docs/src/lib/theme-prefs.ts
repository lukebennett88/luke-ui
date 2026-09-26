import { getHintUtils } from '@epic-web/client-hints';
import { clientHint as colorSchemeHint } from '@epic-web/client-hints/color-scheme';
import { themeClassName as paperThemeClassName } from '@luke-ui/react/themes/paper';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';

export type ThemeIdentity = 'paper' | 'tactile';
export type ColorMode = 'light' | 'dark';
export type ColorModePreference = ColorMode | 'system';

/** Docs theme preferences, read from cookies by the root loader. */
export interface ThemePrefs {
	colorModePreference: ColorModePreference;
	/** `colorModePreference`, with `system` resolved from the client hint cookie. */
	resolvedColorMode: ColorMode;
	themeIdentity: ThemeIdentity;
}

export type ThemePrefsUpdate = Partial<Pick<ThemePrefs, 'colorModePreference' | 'themeIdentity'>>;

export const THEME_IDENTITY_COOKIE_NAME = 'luke-ui-docs-theme';
/** Absent when the preference is `system`. */
export const COLOR_MODE_COOKIE_NAME = 'luke-ui-docs-color-mode';
export const COLOR_SCHEME_HINT_COOKIE_NAME = colorSchemeHint.cookieName;

export const DEFAULT_THEME_PREFS = {
	colorModePreference: 'system',
	resolvedColorMode: 'light',
	themeIdentity: 'tactile',
} as const satisfies ThemePrefs;

/**
 * Inline `<head>` script that writes `prefers-color-scheme` to the hint cookie and reloads once
 * when the cookie was missing or stale, so the server can render `system` correctly.
 */
export const clientHintCheckScript = getHintUtils({
	colorScheme: colorSchemeHint,
}).getClientHintCheckScript();

export function parseThemePrefs(cookies: {
	colorMode: string | undefined;
	colorSchemeHint: string | undefined;
	themeIdentity: string | undefined;
}): ThemePrefs {
	const colorModePreference = parseColorModePreference(cookies.colorMode);
	return {
		colorModePreference,
		resolvedColorMode:
			colorModePreference === 'system'
				? colorSchemeHint.transform(cookies.colorSchemeHint ?? colorSchemeHint.fallback)
				: colorModePreference,
		themeIdentity: cookies.themeIdentity === 'paper' ? 'paper' : 'tactile',
	};
}

export function themeIdentityClassName(themeIdentity: ThemeIdentity): string {
	return THEME_IDENTITY_CLASS_NAMES[themeIdentity];
}

const THEME_IDENTITY_CLASS_NAMES = {
	paper: paperThemeClassName,
	tactile: tactileThemeClassName,
} as const satisfies Record<ThemeIdentity, string>;

function parseColorModePreference(value: string | undefined): ColorModePreference {
	return value === 'light' || value === 'dark' ? value : 'system';
}
