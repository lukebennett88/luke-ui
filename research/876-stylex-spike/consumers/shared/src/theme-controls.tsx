import { Box } from '#ui/box';
import { Button } from '#ui/button';
import { Text } from '#ui/text';

const themes = ['luke-ui-theme-tactile', 'luke-ui-theme-paper'] as const;

/**
 * Switches between precompiled themes and document colour modes. Both theme stylesheets are loaded;
 * the identity class on `<html>` picks the active one, and `data-color-mode` forces a mode.
 */
export function ThemeControls() {
	return (
		<Box
			display="flex"
			flexDirection={{ initial: 'column', bp640: 'row' }}
			gap="space.8"
			alignItems="center"
		>
			<Text typography="label">Theme</Text>
			{themes.map((theme) => (
				<Button
					key={theme}
					data-testid={`theme-${theme}`}
					onPress={() => {
						document.documentElement.classList.remove(...themes);
						document.documentElement.classList.add(theme);
					}}
					prominence="low"
					size="small"
				>
					{theme.replace('luke-ui-theme-', '')}
				</Button>
			))}
			<Text typography="label">Mode</Text>
			{(['system', 'light', 'dark'] as const).map((mode) => (
				<Button
					key={mode}
					data-testid={`mode-${mode}`}
					onPress={() => {
						if (mode === 'system') document.documentElement.removeAttribute('data-color-mode');
						else document.documentElement.setAttribute('data-color-mode', mode);
					}}
					prominence="low"
					size="small"
				>
					{mode}
				</Button>
			))}
		</Box>
	);
}
