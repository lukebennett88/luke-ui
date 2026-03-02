import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { devEntries } from './.generated/entries.js';

const dirname =
	typeof __dirname !== 'undefined'
		? __dirname
		: path.dirname(fileURLToPath(import.meta.url));
const configDir = path.join(dirname, '.storybook');

const packageRoot = path.resolve(dirname);
const packageName = '@luke-ui/react';

const devAliases = Object.entries(devEntries)
	.map(([subpath, sourcePath]) => ({
		find: `${packageName}/${subpath}`,
		replacement: path.resolve(packageRoot, sourcePath),
	}))
	.sort((a, b) => b.find.length - a.find.length);

export default defineConfig({
	resolve: {
		alias: devAliases,
	},
	optimizeDeps: {
		include: [
			'@vanilla-extract/recipes/createRuntimeFn',
			'@react-aria/utils',
			'react',
			'react-aria-components',
			'react-dom',
			'react/jsx-runtime',
			'react/jsx-dev-runtime',
		],
		exclude: devAliases.map((a) => a.find),
	},
	test: {
		projects: [
			{
				extends: true,
				plugins: [
					// Required for .css.ts processing in Vitest browser mode.
					vanillaExtractPlugin(),
					// Runs tests for stories defined in Storybook config.
					storybookTest({ configDir }),
				],
				test: {
					browser: {
						enabled: true,
						headless: true,
						instances: [{ browser: 'chromium' }],
						provider: playwright({}),
					},
					name: 'storybook',
				},
			},
		],
	},
});
