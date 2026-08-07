/**
 * Derives a theme's identity class from its name, and rejects a name that is not kebab-case.
 *
 * A leaf module with no dependencies, because two modules that do not otherwise know about each
 * other both need it: `validate-foundation.ts` checks a foundation's `name` through it, and
 * `stylesheet.ts` needs the class as the emitted stylesheet's selector.
 */

const THEME_NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * Prefix shared by every theme's identity class, before the theme name. This is the one place the
 * literal is written. `themeClassName` and the DOM-fallback path in `useThemeScopeProps` both
 * build from it instead of repeating it.
 */
export const THEME_CLASS_NAME_PREFIX = 'luke-ui-theme-';

/**
 * Returns the identity class for a theme name, `luke-ui-theme-${name}`. Throws when the name is
 * not kebab-case.
 */
export function themeClassName(name: string): string {
	if (!THEME_NAME_PATTERN.test(name)) {
		throw new Error(
			`Theme name "${name}" must be kebab-case: lowercase letters and digits separated by ` +
				'single hyphens, starting with a letter.',
		);
	}
	return `${THEME_CLASS_NAME_PREFIX}${name}`;
}
