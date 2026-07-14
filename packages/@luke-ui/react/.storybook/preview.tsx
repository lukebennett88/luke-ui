/// <reference types="vite/client" />

import '../dist/themes/elmo.css';
import '../dist/themes/machined-edge.css';
import '@luke-ui/react/stylesheet.css';
import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { themeRootClassName, vars } from '@luke-ui/react/theme';
import { elmoThemeClassName, machinedEdgeThemeClassName } from '@luke-ui/react/themes';
import addonA11y from '@storybook/addon-a11y';
import addonDocs from '@storybook/addon-docs';
import { definePreview } from '@storybook/react-vite';
import { useLayoutEffect } from 'react';

export default definePreview({
	addons: [addonA11y(), addonDocs()],
	decorators: [
		(Story, { globals, viewMode }) => {
			const themeClassName =
				globals.theme === 'elmo' ? elmoThemeClassName : machinedEdgeThemeClassName;
			const colorMode = globals.colorMode === 'dark' ? 'dark' : 'light';
			const isStoryView = viewMode === 'story';

			return (
				<IconSpritesheetProvider href={spriteSheetHref}>
					{isStoryView ? (
						<StoryCanvasTheme colorMode={colorMode} themeClassName={themeClassName} />
					) : null}
					<div
						className={`${themeRootClassName} ${themeClassName}`}
						data-color-mode={colorMode}
						style={{ backgroundColor: vars.color.surface.canvas }}
					>
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

function StoryCanvasTheme({
	colorMode,
	themeClassName,
}: {
	colorMode: 'light' | 'dark';
	themeClassName: string;
}) {
	useLayoutEffect(() => {
		const body = document.body;
		const hadThemeClass = body.classList.contains(themeClassName);
		const previousColorMode = body.getAttribute('data-color-mode');
		const previousBackgroundColor = body.style.backgroundColor;

		body.classList.add(themeClassName);
		body.dataset.colorMode = colorMode;
		body.style.backgroundColor = vars.color.surface.canvas;

		return () => {
			if (!hadThemeClass) body.classList.remove(themeClassName);
			if (previousColorMode === null) {
				body.removeAttribute('data-color-mode');
			} else {
				body.dataset.colorMode = previousColorMode;
			}
			body.style.backgroundColor = previousBackgroundColor;
		};
	}, [colorMode, themeClassName]);

	return null;
}
