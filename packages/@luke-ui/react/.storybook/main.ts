import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineMain } from '@storybook/react-vite/node';

function getAbsolutePath(value: string) {
	return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

export default defineMain({
	addons: [
		getAbsolutePath('@storybook/addon-a11y'),
		getAbsolutePath('@storybook/addon-docs'),
		getAbsolutePath('@storybook/addon-vitest'),
	],

	core: {
		disableWhatsNewNotifications: true,
	},

	framework: getAbsolutePath('@storybook/react-vite'),

	stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx|mdx)'],
});
