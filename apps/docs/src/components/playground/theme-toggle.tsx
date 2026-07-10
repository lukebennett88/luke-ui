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
	const { resolvedTheme, setTheme } = useTheme();
	const isMounted = useSyncExternalStore(
		subscribeToHydration,
		getHydratedSnapshot,
		getServerSnapshot,
	);

	const theme = isMounted && isTheme(resolvedTheme) ? resolvedTheme : null;

	return <IconToggleButtonGroup label="Theme" onChange={setTheme} options={THEMES} value={theme} />;
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
