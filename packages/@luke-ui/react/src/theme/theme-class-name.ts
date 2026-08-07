/**
 * Derives a theme's identity class from its name, and rejects a name that is not kebab-case.
 *
 * This module must keep importing nothing. Staying dependency-free is what lets a consumer import
 * one theme's class without pulling in the compiler, a foundation, or colour generation.
 */

const THEME_NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * Returns the identity class for a theme name, `luke-ui-theme-${name}`. Throws when the name is
 * not kebab-case.
 */
export function getThemeClassName(name: string): string {
	if (!THEME_NAME_PATTERN.test(name)) {
		throw new Error(
			`Theme name "${name}" must be kebab-case: lowercase letters and digits separated by ` +
				'single hyphens, starting with a letter.',
		);
	}
	return `luke-ui-theme-${name}`;
}
