import { rootClassName } from '@luke-ui/react/theme';
import { themeClassName as paperThemeClassName } from '@luke-ui/react/themes/paper';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';
import { cx } from '@luke-ui/react/utils';
import type { ComponentProps, PropsWithChildren } from 'react';
import {
	createContext,
	useContext,
	useInsertionEffect,
	useMemo,
	useSyncExternalStore,
} from 'react';
import { ColorModeToggle, useHydratedColorMode } from './playground/color-mode-toggle.js';
import { TextToggleButtonGroup } from './playground/icon-toggle-button-group.js';

export type ThemeIdentity = 'paper' | 'tactile';

const THEME_IDENTITY_STORAGE_KEY = 'luke-ui-docs-theme';
const THEME_IDENTITY_CHANGE_EVENT = 'luke-ui-docs-theme-change';

const THEME_IDENTITY_CLASS_NAMES = {
	paper: paperThemeClassName,
	tactile: tactileThemeClassName,
} as const satisfies Record<ThemeIdentity, string>;

const THEME_IDENTITIES = [
	{ label: 'Tactile', value: 'tactile' },
	{ label: 'Paper', value: 'paper' },
] as const satisfies ReadonlyArray<{ label: string; value: ThemeIdentity }>;

interface ThemeIdentitySettings {
	setThemeIdentity: (themeIdentity: ThemeIdentity) => void;
	themeIdentity: ThemeIdentity;
}

const ThemeIdentitySettingsContext = createContext<ThemeIdentitySettings | null>(null);

export function DocsThemeRoot({ children }: PropsWithChildren) {
	const colorMode = useHydratedColorMode();
	const themeIdentity = useThemeIdentity();
	const settings = useMemo(() => ({ setThemeIdentity, themeIdentity }), [themeIdentity]);

	// The docs site loads both bundled theme stylesheets, so an explicit identity class is
	// required to make one authoritative. It goes on `<html>`, not this root `div`, so a
	// body-level portal inherits it too. `useInsertionEffect` applies it before the browser paints,
	// and its cleanup removes the previous identity first, so the two never both sit on `<html>`.
	useInsertionEffect(() => {
		const identityClassName = THEME_IDENTITY_CLASS_NAMES[themeIdentity];
		document.documentElement.classList.add(identityClassName);
		return () => {
			document.documentElement.classList.remove(identityClassName);
		};
	}, [themeIdentity]);

	return (
		<ThemeIdentitySettingsContext.Provider value={settings}>
			<div
				className={cx(rootClassName, 'flex min-h-screen flex-1 flex-col text-fd-foreground')}
				data-color-mode={colorMode ?? undefined}
			>
				{children}
			</div>
		</ThemeIdentitySettingsContext.Provider>
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

function useThemeIdentity(): ThemeIdentity {
	return useSyncExternalStore(subscribeToThemeIdentity, getThemeIdentity, getServerThemeIdentity);
}

function subscribeToThemeIdentity(onStoreChange: () => void) {
	const handleStorage = (event: StorageEvent) => {
		if (event.key === THEME_IDENTITY_STORAGE_KEY) onStoreChange();
	};

	window.addEventListener('storage', handleStorage);
	window.addEventListener(THEME_IDENTITY_CHANGE_EVENT, onStoreChange);
	return () => {
		window.removeEventListener('storage', handleStorage);
		window.removeEventListener(THEME_IDENTITY_CHANGE_EVENT, onStoreChange);
	};
}

function getThemeIdentity(): ThemeIdentity {
	return localStorage.getItem(THEME_IDENTITY_STORAGE_KEY) === 'paper' ? 'paper' : 'tactile';
}

function getServerThemeIdentity(): ThemeIdentity {
	return 'tactile';
}

function setThemeIdentity(themeIdentity: ThemeIdentity) {
	localStorage.setItem(THEME_IDENTITY_STORAGE_KEY, themeIdentity);
	window.dispatchEvent(new Event(THEME_IDENTITY_CHANGE_EVENT));
}
