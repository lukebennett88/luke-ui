import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { babel } from '@rollup/plugin-babel';
import { vanillaExtractPlugin } from '@vanilla-extract/rollup-plugin';
import react from '@vitejs/plugin-react';
import { readdir, rm } from 'node:fs/promises';
import { defineConfig } from 'tsdown';
import packageJson from './package.json' with { type: 'json' };

const workspaceRoot = fileURLToPath(new URL('../../../', import.meta.url));
const distDir = fileURLToPath(new URL('dist/', import.meta.url));
const preservedDistFiles = new Set(['spritesheet.svg']);

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
		entries
			.filter((entry) => !preservedDistFiles.has(entry))
			.map((entry) => rm(join(distDir, entry), { force: true, recursive: true })),
	);
}

export default defineConfig((options) => ({
	attw: {
		profile: 'esm-only',
		// Exclude static asset exports — attw checks JS type resolution, but CSS/SVG
		// files don't need type definitions. Excluding them avoids false-positive
		// 'no-resolution' errors while keeping the rule active for actual JS exports.
		excludeEntrypoints: ['./stylesheet.css', './spritesheet.svg'],
	},
	deps: {
		neverBundle: Object.keys(packageJson.peerDependencies),
	},
	clean: false,
	dts: true,
	entry: {
		'*': [
			'src/*/index.tsx',
			'src/*/index.ts',
			'!src/style-helpers/index.ts',
			'!src/types/index.ts',
			'!src/typography/index.ts',
		],
		'button/primitive': 'src/button/primitive.tsx',
		'field/primitive': 'src/field/primitive.tsx',
	},
	exports: {
		customExports: {
			'./stylesheet.css': './dist/stylesheet.css',
			'./spritesheet.svg': './dist/spritesheet.svg',
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
		...(options.watch
			? [
					// @ts-expect-error Vite plugin compatibility
					react({ fastRefresh: true }),
				]
			: []),
	],
	publint: true,
	sourcemap: true,
}));
