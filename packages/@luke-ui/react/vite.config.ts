import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { babel } from '@rollup/plugin-babel';
import { vanillaExtractPlugin } from '@vanilla-extract/rollup-plugin';
import react from '@vitejs/plugin-react';
import { readdir, rm } from 'node:fs/promises';
import { defineConfig } from 'vite-plus';
import packageJson from './package.json' with { type: 'json' };

const workspaceRoot = fileURLToPath(new URL('../../../', import.meta.url));
const distDir = fileURLToPath(new URL('dist/', import.meta.url));
const preservedDistFiles = new Set(['spritesheet.svg', 'docs']);

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
		attw: {
			// Exclude static asset exports. CSS/SVG files do not need type definitions.
			excludeEntrypoints: ['./stylesheet.css', './spritesheet.svg'],
			profile: 'esm-only',
		},
		clean: false,
		deps: {
			neverBundle: Object.keys(packageJson.peerDependencies),
		},
		dts: true,
		entry: {
			'*': ['src/*/index.tsx', 'src/*/index.ts', 'src/*/primitive/index.tsx'],
		},
		exports: {
			customExports: {
				'./spritesheet.svg': './dist/spritesheet.svg',
				'./stylesheet.css': './dist/stylesheet.css',
			},
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
