import githubDark from 'shiki/themes/github-dark-high-contrast.mjs';
import githubLight from 'shiki/themes/github-light-high-contrast.mjs';

export const SHIKI_THEME_REGISTRATIONS: [typeof githubLight, typeof githubDark] = [
	githubLight,
	githubDark,
];

/**
 * These Shiki themes apply to MDX fences, examples, and samples. The Monaco
 * playground derives its themes from the same registrations.
 *
 * Theme order controls Shiki's generated classes and custom properties.
 */
export const SHIKI_THEMES = {
	dark: SHIKI_THEME_REGISTRATIONS[1].name,
	light: SHIKI_THEME_REGISTRATIONS[0].name,
};

const [lightTheme, darkTheme] = SHIKI_THEME_REGISTRATIONS;

/**
 * Editor chrome colours taken from the registered GitHub high-contrast themes so the playground
 * pane and skeleton stay in sync with Monaco/Shiki instead of duplicating hex values.
 */
export const monacoChromeColors = {
	dark: {
		background: requireThemeColor(darkTheme, 'editor.background'),
		lineNumber: requireThemeColor(darkTheme, 'editorLineNumber.foreground'),
	},
	light: {
		background: requireThemeColor(lightTheme, 'editor.background'),
		lineNumber: requireThemeColor(lightTheme, 'editorLineNumber.foreground'),
	},
} as const;

function requireThemeColor(theme: (typeof SHIKI_THEME_REGISTRATIONS)[number], key: string): string {
	const value = theme.colors?.[key];
	if (typeof value !== 'string') {
		throw new Error(`Missing ${key} in ${theme.name}`);
	}
	return value;
}

/**
 * A TextMate scope's colour in each registered theme, such as `keyword` or `string`, for text that
 * should match Shiki's highlighting without running Shiki.
 */
export function scopeColors(scope: string): { dark: string; light: string } {
	return { dark: requireScopeColor(darkTheme, scope), light: requireScopeColor(lightTheme, scope) };
}

function requireScopeColor(
	theme: (typeof SHIKI_THEME_REGISTRATIONS)[number],
	scope: string,
): string {
	for (const { scope: scopes, settings } of theme.tokenColors ?? []) {
		const listed = typeof scopes === 'string' ? [scopes] : (scopes ?? []);
		if (listed.includes(scope) && typeof settings.foreground === 'string')
			return settings.foreground;
	}
	throw new Error(`Missing ${scope} scope colour in ${theme.name}`);
}
