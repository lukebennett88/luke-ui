/// <reference types="vite/client" />

import '../dist/themes/elmo.css';
import '../dist/themes/machined-edge.css';
import '@luke-ui/react/stylesheet.css';
import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { themeRootClassName } from '@luke-ui/react/theme';
import { elmoThemeClassName, machinedEdgeThemeClassName } from '@luke-ui/react/themes';
import addonA11y from '@storybook/addon-a11y';
import addonDocs from '@storybook/addon-docs';
import { definePreview } from '@storybook/react-vite';

export default definePreview({
	addons: [addonA11y(), addonDocs()],
	decorators: [
		(Story, { globals }) => {
			const themeClassName =
				globals.theme === 'elmo' ? elmoThemeClassName : machinedEdgeThemeClassName;
			const colorMode = globals.colorMode === 'dark' ? 'dark' : 'light';

			return (
				<IconSpritesheetProvider href={spriteSheetHref}>
					<div className={`${themeRootClassName} ${themeClassName}`} data-color-mode={colorMode}>
						<Story />
					</div>
				</IconSpritesheetProvider>
			);
		},
	],
	globalTypes: {
		colorMode: {
			description: 'Colour mode',
			toolbar: {
				dynamicTitle: true,
				icon: 'contrast',
				items: [
					{ title: 'Light', value: 'light' },
					{ title: 'Dark', value: 'dark' },
				],
			},
		},
		theme: {
			description: 'Luke UI theme',
			toolbar: {
				dynamicTitle: true,
				icon: 'paintbrush',
				items: [
					{ title: 'Machined edge', value: 'machined-edge' },
					{ title: 'ELMO', value: 'elmo' },
				],
			},
		},
	},
	initialGlobals: {
		colorMode: 'light',
		theme: 'machined-edge',
	},
	parameters: {
		a11y: {
			// 'todo' - show a11y violations in the test UI only
			// 'error' - fail CI on a11y violations
			// 'off' - skip a11y checks entirely
			test: 'todo',
		},
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
});

export const tags = ['autodocs'];
