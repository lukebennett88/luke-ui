import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { IconToggleButtonGroup } from './icon-toggle-button-group.js';

const COLOR_MODES = [
	{ icon: 'sun', label: 'Light theme', value: 'light' },
	{ icon: 'moon', label: 'Dark theme', value: 'dark' },
	{ icon: 'circleHalf', label: 'System theme', value: 'system' },
] as const;

type ColorMode = (typeof COLOR_MODES)[number]['value'];

type ColorModeToggleProps = {
	/** Renders the controls on the parent surface instead of in a recessed well. */
	isFlush?: boolean;
};

/** Lets someone choose the light, dark, or system colour mode. */
export function ColorModeToggle({ isFlush }: ColorModeToggleProps) {
	const { setTheme } = useTheme();
	const colorMode = useHydratedColorModeSelection();

	return (
		<IconToggleButtonGroup
			isFlush={isFlush}
			label="Colour mode"
			onChange={setTheme}
			options={COLOR_MODES}
			value={colorMode}
		/>
	);
}

export function useHydratedColorMode(): Exclude<ColorMode, 'system'> | null {
	const { resolvedTheme } = useTheme();
	const isMounted = useIsMounted();

	return isMounted && isColorMode(resolvedTheme) ? resolvedTheme : null;
}

export function useHydratedColorModeSelection(): ColorMode | null {
	const { theme } = useTheme();
	const isMounted = useIsMounted();

	return isMounted && isColorModeSelection(theme) ? theme : null;
}

function useIsMounted() {
	const isMounted = useSyncExternalStore(
		subscribeToHydration,
		getHydratedSnapshot,
		getServerSnapshot,
	);

	return isMounted;
}

function isColorModeSelection(value: string | undefined): value is ColorMode {
	return value === 'light' || value === 'dark' || value === 'system';
}

function isColorMode(value: string | undefined): value is Exclude<ColorMode, 'system'> {
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
