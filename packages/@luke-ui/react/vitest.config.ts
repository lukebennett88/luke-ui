import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { defineConfig } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';

const dirname =
	typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const configDir = path.join(dirname, '.storybook');
const recipeEngineSource = fileURLToPath(new URL('./src/styles/recipe-engine.ts', import.meta.url));
// This file is copied into a git worktree at an older revision. It cannot import
// TypeScript that does not exist there, so it has no relative imports of the
// visual-regression contract. Keep the capture-dir literals below in sync with
// `scripts/visual-regression-contract.ts`; a unit test fails if they drift.
const repoRoot = path.resolve(dirname, '../../..');
const captureDir = process.env.VISUAL_CAPTURE_DIR;
const visualFsAllow =
	captureDir === undefined || captureDir === '' ? [repoRoot] : [repoRoot, path.resolve(captureDir)];

export default defineConfig({
	optimizeDeps: {
		include: [
			'@vanilla-extract/recipes/createRuntimeFn',
			'react-aria-components/Checkbox',
			'react-aria-components/Dialog',
			'react-aria-components/I18nProvider',
			'react-aria-components/Link',
			'react-aria-components/Modal',
			'react-aria-components/Popover',
		],
	},
	server: {
		fs: {
			allow: visualFsAllow,
		},
	},
	resolve: {
		alias: {
			'#recipe-engine': recipeEngineSource,
		},
	},
	test: {
		api: { allowWrite: true },
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
					setupFiles: ['./src/test-utils/render-setup.ts'],
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
						api: { allowWrite: true },
						enabled: true,
						expect: {
							toMatchScreenshot: {
								// Tall scenes are handled in captureVisual, which grows both
								// the page and the test iframe before capturing.
								resolveScreenshotPath: ({ arg, ext, root }) => {
									return path.join(
										process.env.VISUAL_CAPTURE_DIR ?? path.join(root, '.visual-captures'),
										`${arg}${ext}`,
									);
								},
								// Captures are always written fresh (never compared here);
								// actual comparison happens in scripts/visual-regression-lib.ts (compareCaptures).
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
					setupFiles: ['./src/test-utils/render-setup.ts', './src/test-utils/visual-setup.ts'],
				},
			},
		],
	},
});
