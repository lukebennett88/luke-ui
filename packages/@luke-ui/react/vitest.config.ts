import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { argosVitestPlugin } from '@argos-ci/storybook/vitest-plugin';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const dirname =
	typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const configDir = path.join(dirname, '.storybook');
export default defineConfig({
	test: {
		projects: [
			{
				extends: true,
				plugins: [
					// Required for .css.ts processing in Vitest browser mode.
					vanillaExtractPlugin(),
					// Runs tests for stories defined in Storybook config.
					storybookTest({ configDir }),
					argosVitestPlugin({
						uploadToArgos: process.env.ARGOS_UPLOAD === '1',
						token: process.env.ARGOS_TOKEN,
						buildName: 'storybook',
					}),
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
