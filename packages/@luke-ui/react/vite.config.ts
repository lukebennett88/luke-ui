import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { babel } from '@rollup/plugin-babel';
import { vanillaExtractPlugin } from '@vanilla-extract/rollup-plugin';
import react from '@vitejs/plugin-react';
import { readdir, rm } from 'node:fs/promises';
import { defineConfig } from 'vite-plus';
import packageJson from './package.json' with { type: 'json' };

const recipeEngineSource = fileURLToPath(new URL('./src/styles/recipe-engine.ts', import.meta.url));
const workspaceRoot = fileURLToPath(new URL('../../../', import.meta.url));
const distDir = fileURLToPath(new URL('dist/', import.meta.url));
const preservedDistFiles = new Set(['spritesheet.svg', 'docs', 'themes']);
const assetExports = [
	'./stylesheet.css',
	'./spritesheet.svg',
	'./themes/tactile/stylesheet.css',
	'./themes/paper/stylesheet.css',
];

async function cleanDistExceptPreservedFiles() {
	let entries: Array<string>;

	try {
		entries = await readdir(distDir);
	} catch (error) {
		if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
			return;
		}

		throw error;
	}

	await Promise.all(
		entries.flatMap((entry) => {
			if (preservedDistFiles.has(entry)) return [];
			return [rm(join(distDir, entry), { force: true, recursive: true })];
		}),
	);
}

export default defineConfig({
	pack: {
		alias: {
			// Vanilla Extract serializes recipes to `#recipe-engine`; resolve it to source so pack
			// can bundle a relative runtime chunk.
			'#recipe-engine': recipeEngineSource,
		},
		attw: {
			// Exclude static asset exports. CSS/SVG files do not need type definitions.
			excludeEntrypoints: assetExports,
			profile: 'esm-only',
		},
		clean: false,
		deps: {
			neverBundle: Object.keys(packageJson.peerDependencies),
		},
		dts: true,
		entry: {
			stylesheet: 'src/stylesheet.css.ts',
			'*': ['src/*/index.tsx', 'src/*/index.ts'],
			'primitives/*': ['src/primitives/*/index.tsx', 'src/primitives/*/index.ts'],
			'themes/*': ['src/themes/*/index.ts'],
		},
		exports: {
			customExports: Object.fromEntries(
				assetExports.map((path) => [path, `./dist/${path.slice(2)}`]),
			),
			// Build the stylesheet for CSS extraction, but do not expose it as a consumer package subpath.
			exclude: ['stylesheet'],
		},
		format: ['esm'],
		hooks: {
			'build:prepare': cleanDistExceptPreservedFiles,
		},
		outputOptions: {
			assetFileNames: '[name][extname]',
		},
		platform: 'neutral',
		plugins: [
			vanillaExtractPlugin({
				cwd: workspaceRoot,
				extract: { name: 'stylesheet.css', sourcemap: true },
				identifiers: 'short',
			}),
			babel({
				babelHelpers: 'bundled',
				extensions: ['.js', '.jsx', '.ts', '.tsx'],
				parserOpts: {
					plugins: ['jsx', 'typescript'],
					sourceType: 'module',
				},
				plugins: ['babel-plugin-react-compiler'],
			}),
			// @ts-expect-error Vite plugin compatibility
			react({ fastRefresh: true }),
		],
		publint: true,
		sourcemap: true,
	},
});
