import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { defineConfig } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';

const dirname =
	typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const recipeEngineSource = fileURLToPath(
	new URL('./src/core/styles/recipe-engine.ts', import.meta.url),
);
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
						expect: {
							toMatchScreenshot: {
								// Tall scenes are handled in captureVisual, which grows both
								// the page and the test iframe before capturing.
								resolveScreenshotPath: ({ arg, ext, root }) => {
									return path.join(
										captureDir ?? path.join(root, '.visual-captures'),
										`${arg}${ext}`,
									);
								},
							},
						},
						headless: true,
						instances: [{ browser: 'chromium' }],
						provider: playwright({}),
					},
					include: ['src/**/*.browser.test.{ts,tsx}'],
					name: 'browser',
					setupFiles: ['./src/core/test-utils/render-setup.ts'],
					tags: [{ description: 'Captures a screenshot for visual review.', name: 'visual' }],
				},
			},
		],
	},
});
