import type { CustomIconProps } from '@luke-ui/react/icon';
import { cx } from '@luke-ui/react/utils';
import type { ComponentProps, ComponentType, PropsWithChildren } from 'react';
import { useSyncExternalStore } from 'react';
import { MoonIcon, SunIcon } from '../components/docs-icons.js';
import {
	IconToggleButtonGroup,
	TextToggleButtonGroup,
} from '../components/icon-toggle-button-group.js';
import * as styles from './theme-controls.css.js';
import type { ColorModePreference, ThemeIdentity } from './theme-prefs-shared.js';
import {
	getServerThemePrefsSnapshot,
	getThemePrefsSnapshot,
	subscribeToThemePrefs,
	writeThemePrefs,
} from './theme-prefs.js';

/**
 * The column that holds docs content. `<html>` carries the identity class, and `data-color-mode` for
 * an explicit colour mode, set by the head script before paint.
 */
export function DocsThemeRoot({ children }: PropsWithChildren) {
	return <div className={styles.root}>{children}</div>;
}

export function ThemeControls({ className, style, ...props }: ComponentProps<'div'>) {
	const { colorModePreference, setColorModePreference, setThemeIdentity, themeIdentity } =
		useDocsTheme();
	const isHydrated = useIsHydrated();

	return (
		<div
			{...props}
			className={cx(styles.controls, className)}
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
				allowEmptySelection
				description="With neither on, the site follows your system setting."
				label="Colour mode"
				onChange={(mode) => setColorModePreference(mode ?? 'system')}
				options={COLOR_MODES}
				value={colorModePreference === 'system' ? null : colorModePreference}
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
	return {
		...prefs,
		setColorModePreference: persistColorModePreference,
		setThemeIdentity: persistThemeIdentity,
	};
}

const THEME_IDENTITIES = [
	{ label: 'Tactile', value: 'tactile' },
	{ label: 'Paper', value: 'paper' },
] as const satisfies ReadonlyArray<{ label: string; value: ThemeIdentity }>;

const COLOR_MODES = [
	{ icon: SunIcon, label: 'Light', value: 'light' },
	{ icon: MoonIcon, label: 'Dark', value: 'dark' },
] as const satisfies ReadonlyArray<{
	icon: ComponentType<CustomIconProps>;
	label: string;
	value: 'light' | 'dark';
}>;

function persistThemeIdentity(themeIdentity: ThemeIdentity) {
	writeThemePrefs({ themeIdentity });
}

function persistColorModePreference(colorModePreference: ColorModePreference) {
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
