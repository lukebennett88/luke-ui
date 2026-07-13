import type { ChangeEvent, PropsWithChildren } from 'react';
import { createContext, useContext } from 'react';

export type ColorMode = 'dark' | 'light';
export type ThemeName = 'elmo' | 'machined-edge';

interface ThemeSettings {
	colorMode: ColorMode;
	setColorMode: (colorMode: ColorMode) => void;
	setTheme: (theme: ThemeName) => void;
	theme: ThemeName;
}

const ThemeSettingsContext = createContext<ThemeSettings | null>(null);

export function ThemeSettingsProvider({
	children,
	value,
}: PropsWithChildren<{ value: ThemeSettings }>) {
	return <ThemeSettingsContext.Provider value={value}>{children}</ThemeSettingsContext.Provider>;
}

export function ThemeControls() {
	const { colorMode, setColorMode, setTheme, theme } = useThemeSettings();

	function handleThemeChange(event: ChangeEvent<HTMLSelectElement>) {
		setTheme(event.target.value === 'elmo' ? 'elmo' : 'machined-edge');
	}

	function handleColorModeChange(event: ChangeEvent<HTMLSelectElement>) {
		setColorMode(event.target.value === 'dark' ? 'dark' : 'light');
	}

	return (
		<div className="flex items-center gap-1">
			<label>
				<span className="sr-only">Theme</span>
				<select
					aria-label="Theme"
					className="h-8 rounded-md border border-fd-border bg-fd-background px-2 text-fd-foreground text-xs"
					onChange={handleThemeChange}
					value={theme}
				>
					<option value="machined-edge">Machined edge</option>
					<option value="elmo">ELMO</option>
				</select>
			</label>
			<label>
				<span className="sr-only">Color mode</span>
				<select
					aria-label="Color mode"
					className="h-8 rounded-md border border-fd-border bg-fd-background px-2 text-fd-foreground text-xs"
					onChange={handleColorModeChange}
					value={colorMode}
				>
					<option value="light">Light</option>
					<option value="dark">Dark</option>
				</select>
			</label>
		</div>
	);
}

function useThemeSettings() {
	const settings = useContext(ThemeSettingsContext);
	if (!settings) throw new Error('ThemeControls must be rendered inside ThemeSettingsProvider');
	return settings;
}
