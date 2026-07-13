import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { IconToggleButtonGroup } from './icon-toggle-button-group';

const THEMES = [
	{ Icon: SunIcon, label: 'Light theme', value: 'light' },
	{ Icon: MoonIcon, label: 'Dark theme', value: 'dark' },
] as const;

type Theme = (typeof THEMES)[number]['value'];

export function ThemeToggle() {
	const { setTheme } = useTheme();
	const theme = useHydratedTheme();

	return <IconToggleButtonGroup label="Theme" onChange={setTheme} options={THEMES} value={theme} />;
}

export function useHydratedTheme(): Theme | null {
	const { resolvedTheme } = useTheme();
	const isMounted = useSyncExternalStore(
		subscribeToHydration,
		getHydratedSnapshot,
		getServerSnapshot,
	);

	return isMounted && isTheme(resolvedTheme) ? resolvedTheme : null;
}

function isTheme(value: string | undefined): value is Theme {
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
