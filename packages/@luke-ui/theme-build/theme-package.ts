/**
 * The build Paper and Tactile share. Each theme package's `vite.config.ts` uses it as is, so the two
 * packages build, and publish, the same way.
 *
 * It packs `src/index.ts` and `src/input.ts` apart, so the root entry never shares a chunk with the
 * input. It copies `fonts.css` and the Inter it declares from the pinned Fontsource package, so the
 * build never downloads a font. It then compiles `stylesheet.css` from the built `dist/input.js`,
 * the JavaScript consumers install.
 */

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { defineTheme } from '@luke-ui/react/theme/compiler';
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
		deps: { neverBundle: ['@luke-ui/react'], onlyBundle: [] },
		dts: true,
		entry: { index: 'src/index.ts', input: 'src/input.ts' },
		format: ['esm'],
		platform: 'neutral',
		plugins: [
			{
				name: 'luke-ui-theme-stylesheet',
				async writeBundle({ dir = 'dist' }) {
					const { theme } = await import(pathToFileURL(path.resolve(dir, 'input.js')).href);
					await writeFile(path.resolve(dir, 'stylesheet.css'), defineTheme(theme));
				},
			},
		],
		publint: true,
		unbundle: true,
	},
};
