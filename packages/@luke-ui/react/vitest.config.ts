import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { defineConfig } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';
import { createStylexDevPlugin, stylexVanillaExtractPluginFilter } from './stylex-vite-plugin.js';

const dirname =
	typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const configDir = path.join(dirname, '.storybook');
// Visual regression copies this file onto older worktrees that still import
// `#recipe-engine` from Vanilla Extract recipes. Resolve relative to this
// config so the alias lands on that worktree's `recipe-engine.ts`.
const recipeEngineSource = fileURLToPath(
	new URL('./src/core/styles/recipe-engine.ts', import.meta.url),
);
// This file is copied into a git worktree at an older revision. It cannot import
// TypeScript that does not exist there, so it has no relative imports of the
// visual-regression contract. Keep the capture-dir literals below in sync with
// `scripts/visual-regression-contract.ts`; a unit test fails if they drift.
const repoRoot = path.resolve(dirname, '../../..');
const captureDir = process.env.VISUAL_CAPTURE_DIR;
const visualFsAllow =
	captureDir === undefined || captureDir === '' ? [repoRoot] : [repoRoot, path.resolve(captureDir)];

export default defineConfig({
	// `@vanilla-extract/vite-plugin` compiles `.css.ts` files inside its own internal Vite server,
	// built by re-reading this file's *top-level* config and dropping every plugin except
	// `vite-tsconfig-paths` (see `unstable_pluginFilter` below). It never sees a Vitest project's
	// own `plugins` array, so the StyleX dev plugin has to be declared up here too, or the internal
	// server evaluates `tokens.stylex.ts` unconverted and trips the runtime stub. This top-level
	// instance only feeds that internal compiler — Vitest's own transform pipeline still runs each
	// project's own `createStylexDevPlugin()` below.
	plugins: [createStylexDevPlugin()],
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
					vanillaExtractPlugin({ unstable_pluginFilter: stylexVanillaExtractPluginFilter }),
					// Serves `virtual:luke-stylex.css` so StyleX-styled components render styled.
					createStylexDevPlugin(),
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
					vanillaExtractPlugin({ unstable_pluginFilter: stylexVanillaExtractPluginFilter }),
					// Serves `virtual:luke-stylex.css` so StyleX-styled components render styled.
					createStylexDevPlugin(),
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
					setupFiles: ['./src/core/test-utils/render-setup.ts'],
				},
			},
			{
				extends: true,
				plugins: [
					// Required for .css.ts processing in unit tests.
					vanillaExtractPlugin({ unstable_pluginFilter: stylexVanillaExtractPluginFilter }),
				],
				test: {
					// These tests read emitted declarations from `dist`. The `test:types` script runs
					// `generate` and `build` first, so it provisions its own `dist` however it is invoked.
					// `test:ci` runs it before the other projects, which makes it the single build step
					// for the whole chain, so nothing else should build the package again.
					environment: 'node',
					include: ['src/**/*.test-d.ts'],
					name: 'types',
					typecheck: {
						enabled: true,
						include: ['src/**/*.test-d.ts'],
						tsconfig: './tsconfig.json',
					},
				},
			},
			{
				extends: true,
				plugins: [
					// Required for .css.ts processing in Vitest browser mode.
					vanillaExtractPlugin({ unstable_pluginFilter: stylexVanillaExtractPluginFilter }),
					// Serves `virtual:luke-stylex.css` so StyleX-styled components render styled.
					createStylexDevPlugin(),
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
					vanillaExtractPlugin({ unstable_pluginFilter: stylexVanillaExtractPluginFilter }),
					// Serves `virtual:luke-stylex.css` so StyleX-styled components render styled.
					createStylexDevPlugin(),
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
										captureDir ?? path.join(root, '.visual-captures'),
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
					setupFiles: [
						'./src/core/test-utils/render-setup.ts',
						'./src/core/test-utils/visual-setup.ts',
					],
				},
			},
		],
	},
});
