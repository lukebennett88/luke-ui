import { rootClassName } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import type { ComponentProps, PropsWithChildren } from 'react';
import { useSyncExternalStore } from 'react';
import type { ColorModePreference, ThemeIdentity } from '../lib/theme-prefs.js';
import {
	getServerThemePrefsSnapshot,
	getThemePrefsSnapshot,
	subscribeToThemePrefs,
	writeThemePrefs,
} from '../lib/theme-prefs.js';
import {
	IconToggleButtonGroup,
	TextToggleButtonGroup,
} from './playground/icon-toggle-button-group.js';

/**
 * The Luke UI theme root for docs content. `<html>` carries the identity class and
 * `data-color-mode`, set by the head script before paint.
 */
export function DocsThemeRoot({ children }: PropsWithChildren) {
	return (
		<div className={cx(rootClassName, 'flex min-h-dvh flex-1 flex-col text-fd-foreground')}>
			{children}
		</div>
	);
}

export function ThemeControls({ className, style, ...props }: ComponentProps<'div'>) {
	const { colorModePreference, setColorModePreference, setThemeIdentity, themeIdentity } =
		useDocsTheme();
	const isHydrated = useIsHydrated();

	return (
		<div
			{...props}
			className={cx('flex items-center gap-1', className)}
			// Static HTML renders the default selection, so stay hidden until the stored one is known.
			style={isHydrated ? style : { ...style, visibility: 'hidden' }}
		>
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

/** Reads the docs theme prefs from `localStorage` and follows changes from any tab. */
export function useDocsTheme() {
	const prefs = useSyncExternalStore(
		subscribeToThemePrefs,
		getThemePrefsSnapshot,
		getServerThemePrefsSnapshot,
	);
	return { ...prefs, setColorModePreference, setThemeIdentity };
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

function setThemeIdentity(themeIdentity: ThemeIdentity) {
	writeThemePrefs({ themeIdentity });
}

function setColorModePreference(colorModePreference: ColorModePreference) {
	writeThemePrefs({ colorModePreference });
}

function useIsHydrated() {
	return useSyncExternalStore(subscribeToNothing, getHydratedSnapshot, getServerHydratedSnapshot);
}

function subscribeToNothing() {
	return () => {};
}

function getHydratedSnapshot() {
	return true;
}

function getServerHydratedSnapshot() {
	return false;
}
