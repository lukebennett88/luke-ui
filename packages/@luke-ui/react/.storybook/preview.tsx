/// <reference types="vite/client" />

import '../dist/themes/machined-edge.css';
import '@luke-ui/react/stylesheet.css';
import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { themeRootClassName } from '@luke-ui/react/theme';
import { machinedEdgeThemeClassName } from '@luke-ui/react/themes';
import addonA11y from '@storybook/addon-a11y';
import addonDocs from '@storybook/addon-docs';
import { definePreview } from '@storybook/react-vite';

export default definePreview({
	addons: [addonA11y(), addonDocs()],
	decorators: [
		(Story) => (
			<IconSpritesheetProvider href={spriteSheetHref}>
				<div
					className={`${themeRootClassName} ${machinedEdgeThemeClassName}`}
					data-color-mode="light"
				>
					<Story />
				</div>
			</IconSpritesheetProvider>
		),
	],
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
