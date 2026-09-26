import { rootClassName } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import type { ComponentProps, PropsWithChildren } from 'react';
import {
	createContext,
	useContext,
	useInsertionEffect,
	useMemo,
	useSyncExternalStore,
} from 'react';
import { ServerThemePrefsProvider } from '../lib/theme-prefs-context.js';
import type { ThemeIdentity, ThemePrefs } from '../lib/theme-prefs.js';
import {
	DEFAULT_THEME_PREFS,
	readThemeIdentityPreference,
	subscribeToThemeIdentityPreference,
	themeIdentityClassName,
	writeThemeIdentityPreference,
} from '../lib/theme-prefs.js';
import { ColorModeToggle, useResolvedColorMode } from './playground/color-mode-toggle.js';
import { TextToggleButtonGroup } from './playground/icon-toggle-button-group.js';

export type { ThemeIdentity };

const THEME_IDENTITIES = [
	{ label: 'Tactile', value: 'tactile' },
	{ label: 'Paper', value: 'paper' },
] as const satisfies ReadonlyArray<{ label: string; value: ThemeIdentity }>;

interface ThemeIdentitySettings {
	setThemeIdentity: (themeIdentity: ThemeIdentity) => void;
	themeIdentity: ThemeIdentity;
}

const ThemeIdentitySettingsContext = createContext<ThemeIdentitySettings | null>(null);

interface DocsThemeRootProps extends PropsWithChildren {
	/** Prefs from the root loader (cookies). Defaults when rendered outside the router. */
	initialPrefs?: ThemePrefs;
}

export function DocsThemeRoot({ children, initialPrefs = DEFAULT_THEME_PREFS }: DocsThemeRootProps) {
	const colorMode = useResolvedColorMode(initialPrefs.colorMode);
	const themeIdentity = useThemeIdentity(initialPrefs.themeIdentity);
	const settings = useMemo(
		() => ({ setThemeIdentity: writeThemeIdentityPreference, themeIdentity }),
		[themeIdentity],
	);

	// The class goes on `<html>`, not this root `div`, so a body-level portal inherits it too.
	// `useInsertionEffect` applies it before the browser paints after a client-side switch.
	useInsertionEffect(() => {
		const identityClassName = themeIdentityClassName(themeIdentity);
		document.documentElement.classList.add(identityClassName);
		return () => {
			document.documentElement.classList.remove(identityClassName);
		};
	}, [themeIdentity]);

	return (
		<ServerThemePrefsProvider value={initialPrefs}>
			<ThemeIdentitySettingsContext.Provider value={settings}>
				<div
					className={cx(rootClassName, 'flex min-h-dvh flex-1 flex-col text-fd-foreground')}
					data-color-mode={colorMode ?? undefined}
				>
					{children}
				</div>
			</ThemeIdentitySettingsContext.Provider>
		</ServerThemePrefsProvider>
	);
}

export function ThemeControls({ className, ...props }: ComponentProps<'div'>) {
	const { setThemeIdentity, themeIdentity } = useDocsThemeIdentity();

	return (
		<div {...props} className={cx('flex items-center gap-1', className)}>
			<TextToggleButtonGroup
				label="Theme profile"
				onChange={setThemeIdentity}
				options={THEME_IDENTITIES}
				value={themeIdentity}
			/>
			<ColorModeToggle />
		</div>
	);
}

export function useDocsThemeIdentity() {
	const settings = useContext(ThemeIdentitySettingsContext);
	if (!settings) throw new Error('ThemeControls must be rendered inside DocsThemeRoot');
	return settings;
}

function useThemeIdentity(serverThemeIdentity: ThemeIdentity): ThemeIdentity {
	return useSyncExternalStore(
		subscribeToThemeIdentityPreference,
		readThemeIdentityPreference,
		() => serverThemeIdentity,
	);
}
