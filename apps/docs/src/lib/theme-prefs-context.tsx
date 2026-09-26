import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { ThemePrefs } from './theme-prefs.js';
import { DEFAULT_THEME_PREFS } from './theme-prefs.js';

const ServerThemePrefsContext = createContext<ThemePrefs>(DEFAULT_THEME_PREFS);

export function ServerThemePrefsProvider({
	children,
	value,
}: {
	children: ReactNode;
	value: ThemePrefs;
}) {
	return (
		<ServerThemePrefsContext.Provider value={value}>{children}</ServerThemePrefsContext.Provider>
	);
}

/** Prefs from the root loader. Defaults when rendered outside the router (tests, stories). */
export function useServerThemePrefs(): ThemePrefs {
	return useContext(ServerThemePrefsContext);
}
