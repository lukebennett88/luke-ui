import { themeRootClassName } from '@luke-ui/react/theme';
import { elmoThemeClassName, machinedEdgeThemeClassName } from '@luke-ui/react/themes';
import { cx } from '@luke-ui/react/utils';
import type { ChangeEvent, ComponentProps, PropsWithChildren } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import { ThemeToggle, useHydratedTheme } from './playground/theme-toggle';

export type ThemeName = 'elmo' | 'machined-edge';

interface ThemeSettings {
	setTheme: (theme: ThemeName) => void;
	theme: ThemeName;
}

const ThemeSettingsContext = createContext<ThemeSettings | null>(null);

export function DocsThemeRoot({ children }: PropsWithChildren) {
	const colorMode = useHydratedTheme();
	const [theme, setTheme] = useState<ThemeName>('machined-edge');
	const themeClassName =
		theme === 'machined-edge' ? machinedEdgeThemeClassName : elmoThemeClassName;
	const settings = useMemo(() => ({ setTheme, theme }), [theme]);

	return (
		<ThemeSettingsContext.Provider value={settings}>
			<div
				className={cx(themeRootClassName, themeClassName, 'flex min-h-screen flex-1 flex-col')}
				data-color-mode={colorMode ?? undefined}
			>
				{children}
			</div>
		</ThemeSettingsContext.Provider>
	);
}

export function ThemeControls({ className, ...props }: ComponentProps<'div'>) {
	const { setTheme, theme } = useThemeSettings();

	function handleThemeChange(event: ChangeEvent<HTMLSelectElement>) {
		setTheme(event.target.value === 'elmo' ? 'elmo' : 'machined-edge');
	}

	return (
		<div {...props} className={cx('flex items-center gap-1', className)}>
			<label>
				<span className="sr-only">Theme profile</span>
				<select
					aria-label="Theme profile"
					className="h-8 rounded-md border border-fd-border bg-fd-background px-2 text-fd-foreground text-xs"
					onChange={handleThemeChange}
					value={theme}
				>
					<option value="machined-edge">Machined edge</option>
					<option value="elmo">ELMO</option>
				</select>
			</label>
			<ThemeToggle />
		</div>
	);
}

function useThemeSettings() {
	const settings = useContext(ThemeSettingsContext);
	if (!settings) throw new Error('ThemeControls must be rendered inside DocsThemeRoot');
	return settings;
}
