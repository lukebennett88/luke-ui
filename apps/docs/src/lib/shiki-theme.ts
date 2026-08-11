import githubDark from 'shiki/themes/github-dark.mjs';
import githubLight from 'shiki/themes/github-light.mjs';

export const SHIKI_THEME_REGISTRATIONS: [typeof githubLight, typeof githubDark] = [
	githubLight,
	githubDark,
];

/**
 * These Shiki themes apply to MDX fences, examples, and samples.
 *
 * Theme order controls Shiki's generated classes and custom properties.
 */
export const SHIKI_THEMES = {
	dark: SHIKI_THEME_REGISTRATIONS[1].name,
	light: SHIKI_THEME_REGISTRATIONS[0].name,
};
