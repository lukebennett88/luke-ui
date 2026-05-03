import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineMain } from '@storybook/react-vite/node';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

function getAbsolutePath(value: string) {
	return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const packageDir = fileURLToPath(new URL('..', import.meta.url));
const srcDir = resolve(packageDir, 'src');
const distDir = resolve(packageDir, 'dist');

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

	// Resolve `@luke-ui/react/*` to source files so Vite watches and HMRs them
	// directly. Without this, Storybook reads the prebuilt `dist/` and won't pick
	// up changes until the dev server is restarted.
	viteFinal(config) {
		config.plugins = [...(config.plugins ?? []), ...vanillaExtractPlugin()];
		config.resolve ??= {};
		const existingAliases = Array.isArray(config.resolve.alias) ? config.resolve.alias : [];
		config.resolve.alias = [
			{
				find: /^@luke-ui\/react\/spritesheet\.svg(\?.*)?$/,
				replacement: `${resolve(distDir, 'spritesheet.svg')}$1`,
			},
			{
				find: /^@luke-ui\/react\/stylesheet\.css(\?.*)?$/,
				replacement: `${resolve(srcDir, 'stylesheet.css.ts')}$1`,
			},
			{
				find: /^@luke-ui\/react\/(.+?)(\?.*)?$/,
				replacement: `${srcDir}/$1$2`,
			},
			...existingAliases,
		];
		return config;
	},
});
