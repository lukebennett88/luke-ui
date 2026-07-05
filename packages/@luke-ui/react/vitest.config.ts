import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { defineConfig } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';

const dirname =
	typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const configDir = path.join(dirname, '.storybook');
export default defineConfig({
	optimizeDeps: {
		include: [
			'@vanilla-extract/recipes/createRuntimeFn',
			'react-aria-components/I18nProvider',
			'react-aria-components/Link',
		],
	},
	test: {
		projects: [
			{
				extends: true,
				plugins: [
					// Required for .css.ts processing in unit tests.
					vanillaExtractPlugin(),
				],
				test: {
					environment: 'node',
					exclude: ['**/node_modules/**', '**/*.browser.test.*'],
					include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
					name: 'unit',
				},
			},
			{
				extends: true,
				plugins: [
					// Required for .css.ts processing in Vitest browser mode.
					vanillaExtractPlugin(),
				],
				test: {
					browser: {
						enabled: true,
						headless: true,
						instances: [{ browser: 'chromium' }],
						provider: playwright({}),
					},
					include: ['src/**/*.browser.test.{ts,tsx}'],
					name: 'browser',
				},
			},
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
			{
				extends: true,
				plugins: [
					// Required for .css.ts processing in Vitest browser mode.
					vanillaExtractPlugin(),
				],
				test: {
					browser: {
						enabled: true,
						expect: {
							toMatchScreenshot: {
								comparatorName: 'pixelmatch',
								comparatorOptions: {
									// Baselines are captured on the same OS/browser as CI, and
									// motion is frozen (see `visual-setup.ts`), so rendering is
									// deterministic. Keep a tiny tolerance only for anti-aliasing
									// jitter; raise it if a real regression proves otherwise.
									allowedMismatchedPixelRatio: 0.001,
								},
							},
						},
						headless: true,
						instances: [{ browser: 'chromium' }],
						provider: playwright({}),
						// Fixed viewport so full-page captures (open menus render in
						// portals outside the component) are deterministic.
						viewport: { height: 800, width: 1024 },
					},
					include: ['src/**/*.visual.test.{ts,tsx}'],
					name: 'visual',
					setupFiles: ['./src/test-utils/visual-setup.ts'],
				},
			},
		],
	},
});
