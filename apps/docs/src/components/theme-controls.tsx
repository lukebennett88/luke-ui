import { rootClassName } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import type { ComponentProps, PropsWithChildren } from 'react';
import { createContext, useContext, useMemo, useState, useSyncExternalStore } from 'react';
import type {
	ColorMode,
	ColorModePreference,
	ThemeIdentity,
	ThemePrefs,
	ThemePrefsUpdate,
} from '../lib/theme-prefs.js';
import { DEFAULT_THEME_PREFS } from '../lib/theme-prefs.js';
import {
	IconToggleButtonGroup,
	TextToggleButtonGroup,
} from './playground/icon-toggle-button-group.js';

interface DocsThemeSettings {
	colorModePreference: ColorModePreference;
	/** Applies prefs to this document without persisting them. */
	previewThemePrefs: (update: ThemePrefsUpdate) => void;
	resolvedColorMode: ColorMode;
	setColorModePreference: (colorModePreference: ColorModePreference) => void;
	setThemeIdentity: (themeIdentity: ThemeIdentity) => void;
	themeIdentity: ThemeIdentity;
}

interface DocsThemeProviderProps extends PropsWithChildren {
	/** Persists a change. Rejecting reverts the optimistic update. */
	onPrefsChange?: (update: ThemePrefsUpdate) => Promise<unknown> | void;
	/** Server-rendered prefs. A new object replaces any optimistic update. */
	prefs?: ThemePrefs;
}

const DocsThemeContext = createContext<DocsThemeSettings | null>(null);

/** Holds the docs theme prefs, applying changes optimistically before `onPrefsChange` settles. */
export function DocsThemeProvider({
	children,
	onPrefsChange,
	prefs = DEFAULT_THEME_PREFS,
}: DocsThemeProviderProps) {
	const [optimistic, setOptimistic] = useState<{ base: ThemePrefs; update: ThemePrefsUpdate }>({
		base: prefs,
		update: {},
	});
	if (optimistic.base !== prefs) setOptimistic({ base: prefs, update: {} });

	const themeIdentity = optimistic.update.themeIdentity ?? prefs.themeIdentity;
	const colorModePreference = optimistic.update.colorModePreference ?? prefs.colorModePreference;
	// The server resolves `system` from the client hint cookie; the client follows the media query.
	const systemColorMode = useSyncExternalStore(
		subscribeToColorScheme,
		getColorScheme,
		() => prefs.resolvedColorMode,
	);
	const resolvedColorMode =
		colorModePreference === 'system' ? systemColorMode : colorModePreference;

	// Kept stable apart from `onPrefsChange` so effects can depend on the actions.
	const actions = useMemo(() => {
		function previewThemePrefs(update: ThemePrefsUpdate) {
			setOptimistic((current) => ({ ...current, update: { ...current.update, ...update } }));
		}
		function updateThemePrefs(update: ThemePrefsUpdate) {
			previewThemePrefs(update);
			Promise.resolve(onPrefsChange?.(update)).catch((error: unknown) => {
				setOptimistic((current) => ({ ...current, update: {} }));
				reportError(error);
			});
		}

		return {
			previewThemePrefs,
			setColorModePreference: (value: ColorModePreference) =>
				updateThemePrefs({ colorModePreference: value }),
			setThemeIdentity: (value: ThemeIdentity) => updateThemePrefs({ themeIdentity: value }),
		};
	}, [onPrefsChange]);
	const settings = useMemo(
		() => ({ ...actions, colorModePreference, resolvedColorMode, themeIdentity }),
		[actions, colorModePreference, resolvedColorMode, themeIdentity],
	);

	return <DocsThemeContext.Provider value={settings}>{children}</DocsThemeContext.Provider>;
}

/** The Luke UI theme root for docs content. `<html>` carries the identity class. */
export function DocsThemeRoot({ children }: PropsWithChildren) {
	const { resolvedColorMode } = useDocsTheme();

	return (
		<div
			className={cx(rootClassName, 'flex min-h-dvh flex-1 flex-col text-fd-foreground')}
			data-color-mode={resolvedColorMode}
		>
			{children}
		</div>
	);
}

export function ThemeControls({ className, ...props }: ComponentProps<'div'>) {
	const { colorModePreference, setColorModePreference, setThemeIdentity, themeIdentity } =
		useDocsTheme();

	return (
		<div {...props} className={cx('flex items-center gap-1', className)}>
			<TextToggleButtonGroup
				label="Theme profile"
				onChange={setThemeIdentity}
				options={THEME_IDENTITIES}
				value={themeIdentity}
			/>
			<IconToggleButtonGroup
				label="Colour mode"
				onChange={setColorModePreference}
				options={COLOR_MODES}
				value={colorModePreference}
			/>
		</div>
	);
}

export function useDocsTheme() {
	const settings = useContext(DocsThemeContext);
	if (!settings) throw new Error('useDocsTheme must be used inside DocsThemeProvider');
	return settings;
}

const THEME_IDENTITIES = [
	{ label: 'Tactile', value: 'tactile' },
	{ label: 'Paper', value: 'paper' },
] as const satisfies ReadonlyArray<{ label: string; value: ThemeIdentity }>;

const COLOR_MODES = [
	{ icon: 'sun', label: 'Light theme', value: 'light' },
	{ icon: 'moon', label: 'Dark theme', value: 'dark' },
	{ icon: 'circleHalf', label: 'System theme', value: 'system' },
] as const;

const DARK_COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';

function subscribeToColorScheme(onChange: () => void) {
	const query = window.matchMedia(DARK_COLOR_SCHEME_QUERY);
	query.addEventListener('change', onChange);
	return () => query.removeEventListener('change', onChange);
}

function getColorScheme(): ColorMode {
	return window.matchMedia(DARK_COLOR_SCHEME_QUERY).matches ? 'dark' : 'light';
}
