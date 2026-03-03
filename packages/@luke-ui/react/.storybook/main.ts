import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineMain } from '@storybook/react-vite/node';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { devEntries } from '../.generated/entries.js';

const packageName = '@luke-ui/react';
const packageRoot = fileURLToPath(new URL('..', import.meta.url));

function getAbsolutePath(value: string) {
	return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const devAliases = Object.entries(devEntries)
	.map(([subpath, sourcePath]) => ({
		find: `${packageName}/${subpath}`,
		replacement: resolve(packageRoot, sourcePath),
	}))
	.sort((a, b) => b.find.length - a.find.length);

const exportSpecifiers = devAliases.map((alias) => alias.find);

function normalizeStorybookBasePath(basePath: string | undefined) {
	if (!basePath) return '/';
	const trimmed = basePath.trim();
	if (!trimmed) return '/';
	const prefixed = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
	return prefixed.endsWith('/') ? prefixed : `${prefixed}/`;
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

	viteFinal: (config) => {
		config.plugins ??= [];
		config.plugins.push(vanillaExtractPlugin());
		config.base = normalizeStorybookBasePath(process.env.STORYBOOK_BASE_PATH);

		config.resolve ??= {};
		config.resolve.alias = [
			...(Array.isArray(config.resolve.alias) ? config.resolve.alias : []),
			...devAliases,
		];

		config.optimizeDeps ??= {};
		config.optimizeDeps.exclude = [
			...(config.optimizeDeps.exclude ?? []),
			...exportSpecifiers,
		];

		return config;
	},
});
