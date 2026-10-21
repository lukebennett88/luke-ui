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

import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type * as ThemeCompiler from '@luke-ui/react/theme/compiler';
import { writeFile } from 'node:fs/promises';
import type { UserConfig } from 'vite-plus';

const require = createRequire(import.meta.url);

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
				buildStart() {
					this.addWatchFile(fileURLToPath(import.meta.resolve('@luke-ui/react/theme/compiler')));
				},
				name: 'luke-ui-theme-stylesheet',
				async writeBundle({ dir = 'dist' }) {
					const input = pathToFileURL(path.resolve(dir, 'input.js'));
					// Node caches imports by URL. Each rebuild needs the current input and compiler.
					input.search = `build=${randomUUID()}`;
					const compiler = new URL(import.meta.resolve('@luke-ui/react/theme/compiler'));
					compiler.search = input.search;
					const { theme } = await import(input.href);
					const { defineTheme }: typeof ThemeCompiler = await import(compiler.href);
					await writeFile(path.resolve(dir, 'stylesheet.css'), defineTheme(theme));
				},
			},
		],
		publint: true,
	},
};
