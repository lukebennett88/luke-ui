/**
 * A theme's identity class: the one stable class name the emitted stylesheet scopes every declaration
 * to. Dependency-free on purpose, because three unrelated callers need the same rule — the foundation
 * validator (which reports an unusable name alongside the rest of the foundation's issues), the
 * stylesheet writer (which builds its selector from it), and the bundled themes (which export the
 * class name as public API).
 */

const THEME_NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

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
	return `luke-ui-theme-${name}`;
}
