import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { useServerThemePrefs } from '../../lib/theme-prefs-context.js';
import type { ColorModePreference } from '../../lib/theme-prefs.js';
import {
	DEFAULT_COLOR_MODE,
	readColorModePreference,
	subscribeToColorModePreference,
	writeColorModePreference,
} from '../../lib/theme-prefs.js';
import { IconToggleButtonGroup } from './icon-toggle-button-group.js';

const COLOR_MODES = [
	{ icon: 'sun', label: 'Light theme', value: 'light' },
	{ icon: 'moon', label: 'Dark theme', value: 'dark' },
	{ icon: 'circleHalf', label: 'System theme', value: 'system' },
] as const;

export type ColorMode = ColorModePreference;

/** Lets someone choose the light, dark, or system colour mode. */
export function ColorModeToggle() {
	const { setTheme } = useTheme();
	const colorMode = useColorModeSelection();

	return (
		<IconToggleButtonGroup
			label="Colour mode"
			onChange={(nextMode) => {
				writeColorModePreference(nextMode);
				setTheme(nextMode);
			}}
			options={COLOR_MODES}
			value={colorMode}
		/>
	);
}

/**
 * Resolved light/dark for `data-color-mode`. Explicit prefs are known on the server; `system`
 * stays unset until mount so CSS can follow `prefers-color-scheme`.
 */
export function useResolvedColorMode(
	serverColorMode: ColorModePreference = DEFAULT_COLOR_MODE,
): Exclude<ColorMode, 'system'> | null {
	const colorMode = useColorModeSelection(serverColorMode);
	const { resolvedTheme } = useTheme();
	const isMounted = useIsMounted();

	if (colorMode === 'light' || colorMode === 'dark') return colorMode;
	return isMounted && isResolvedColorMode(resolvedTheme) ? resolvedTheme : null;
}

/** Selected colour-mode preference, available on the first server render from cookies. */
export function useColorModeSelection(
	serverColorMode?: ColorModePreference,
): ColorModePreference {
	const prefs = useServerThemePrefs();
	const fallback = serverColorMode ?? prefs.colorMode;

	return useSyncExternalStore(
		subscribeToColorModePreference,
		readColorModePreference,
		() => fallback,
	);
}

function useIsMounted() {
	return useSyncExternalStore(subscribeToHydration, getHydratedSnapshot, getServerSnapshot);
}

function isResolvedColorMode(value: string | undefined): value is Exclude<ColorMode, 'system'> {
	return value === 'light' || value === 'dark';
}

function subscribeToHydration() {
	return () => {};
}

function getHydratedSnapshot() {
	return true;
}

function getServerSnapshot() {
	return false;
}
