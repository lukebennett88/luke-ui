import { createContext, useContext } from 'react';

/** An explicit colour mode. Omit it to follow `prefers-color-scheme`. */
export type ColorMode = 'dark' | 'light';

/** The theme identity and colour mode a `<Theme>` applies to its subtree. */
export interface ThemeScope {
	/** The explicit colour mode, or `undefined` when the scope follows the system preference. */
	colorMode: ColorMode | undefined;
	/** The theme's name, as given to `defineTheme`. */
	name: string;
}

/**
 * Internal to the `theme` directory: `Theme` provides it and `useThemeScope`/`useThemeScopeProps`
 * read it. It is not re-exported from the barrel. Consumers use `Theme` and `useThemeScopeProps`.
 */
export const ThemeScopeContext = createContext<ThemeScope | null>(null);

/** Reads the theme scope of the nearest enclosing `Theme`, or `null` outside of one. */
export function useThemeScope(): ThemeScope | null {
	return useContext(ThemeScopeContext);
}
