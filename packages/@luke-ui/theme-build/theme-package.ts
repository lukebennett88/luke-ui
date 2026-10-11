/**
 * The build Paper and Tactile share. Each theme package's `vite.config.ts` uses it as is, so the two
 * packages build, and publish, the same way.
 *
 * It bundles `src/index.ts` and `src/input.ts` as separate entries, which share only the theme's
 * name. The input imports its font metrics from `@capsizecss/metrics`, and the build inlines them,
 * so consumers never install Capsize. It copies `fonts.css` and the Inter it declares from the
 * pinned Fontsource package, so the build never downloads a font. It then compiles
 * `stylesheet.css` from the built `dist/input.js`, the JavaScript consumers install.
 */

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { defineTheme } from '@luke-ui/react/theme/compiler';
import { writeFile } from 'node:fs/promises';
import type { UserConfig } from 'vite-plus';

const require = createRequire(import.meta.url);

/**
 * Counts the builds in this process. Node caches an imported module by URL, so each build imports
 * `input.js` under its own query, or a rebuild in watch mode would compile the first build's input.
 */
let build = 0;

export const themePackage: UserConfig = {
	pack: {
		copy: [
			{ from: fileURLToPath(new URL('fonts.css', import.meta.url)), to: 'dist' },
			{
				from: require.resolve('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'),
				to: 'dist/fonts',
			},
			{
				from: require.resolve('@fontsource-variable/inter/LICENSE'),
				rename: 'OFL.txt',
				to: 'dist/fonts',
			},
		],
		// Only Capsize's metrics may be inlined. Anything else from `node_modules` fails the build.
		deps: { neverBundle: ['@luke-ui/react'], onlyBundle: ['@capsizecss/metrics'] },
		dts: true,
		entry: { index: 'src/index.ts', input: 'src/input.ts' },
		exports: {
			customExports: {
				'./fonts.css': './dist/fonts.css',
				'./stylesheet.css': './dist/stylesheet.css',
			},
		},
		format: ['esm'],
		platform: 'neutral',
		plugins: [
			{
				name: 'luke-ui-theme-stylesheet',
				async writeBundle({ dir = 'dist' }) {
					const input = pathToFileURL(path.resolve(dir, 'input.js'));
					build += 1;
					input.search = `build=${build}`;
					const { theme } = await import(input.href);
					await writeFile(path.resolve(dir, 'stylesheet.css'), defineTheme(theme));
				},
			},
		],
		publint: true,
	},
};
