import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeIdFiltersToMatchWithQuery } from '@rolldown/pluginutils';
import { vanillaExtractPlugin } from '@vanilla-extract/rollup-plugin';
import react from '@vitejs/plugin-react';
import { readdir, rm } from 'node:fs/promises';
import { transformSync } from 'oxc-transform-react';
import type { Plugin } from 'vite-plus';
import { defineConfig } from 'vite-plus';
import packageJson from './package.json' with { type: 'json' };
import { createStylexPackPlugin, workspaceRoot } from './stylex-vite-plugin.js';

const distDir = fileURLToPath(new URL('dist/', import.meta.url));
const preservedDistFiles = new Set(['spritesheet.svg', 'docs', 'themes']);
const assetExports = [
	'./stylesheet.css',
	'./spritesheet.svg',
	'./themes/tactile/stylesheet.css',
	'./themes/paper/stylesheet.css',
];

/** Any JS or TS module the React Compiler can read, including `.mjs`/`.cts` variants. */
const sourceModule = /\.[cm]?[jt]sx?$/;
/** Vanilla Extract compiles these to plain style declarations before the plugin sees them. */
const vanillaExtractStyles = /\.css\.ts$/;
const dependency = /\/node_modules\//;

export default defineConfig({
	pack: {
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
			stylesheet: 'src/core/stylesheet.css.ts',
			'stylex-bundle': 'src/core/styles/stylex-bundle.ts',
			'*': ['src/exports/*.ts'],
			'primitives/*': ['src/exports/primitives/*.ts'],
			'themes/*': ['src/exports/themes/*.ts'],
		},
		exports: {
			customExports: Object.fromEntries(
				assetExports.map((path) => [path, `./dist/${path.slice(2)}`]),
			),
			// Built for extraction; not consumer subpaths.
			exclude: ['stylesheet', 'stylex-bundle'],
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
			// StyleX runs before the React Compiler: it needs the original `stylex.create` calls,
			// which the compiler's output would have already rewritten past recognition.
			createStylexPackPlugin(),
			reactCompilerPlugin(),
			// @ts-expect-error Vite plugin compatibility
			react({ fastRefresh: true }),
		],
		publint: true,
		sourcemap: true,
	},
});

function reactCompilerPlugin(): Plugin {
	return {
		name: 'react-compiler',
		transform: {
			filter: {
				id: {
					include: makeIdFiltersToMatchWithQuery([sourceModule]),
					exclude: makeIdFiltersToMatchWithQuery([vanillaExtractStyles, dependency]),
				},
			},
			handler(code, id) {
				// Oxc infers the language from the filename, so a query suffix has to be stripped
				// or parsing fails. Vanilla Extract appends one to the ids it emits.
				const filename = id.split('?')[0] ?? id;

				// Passing `lang` is redundant for the JS output, which is byte-identical without
				// it, but omitting it makes `vp pack` emit hollow `.d.ts` chunks. Keep it set.
				const lang = filename.endsWith('x') ? 'tsx' : 'ts';

				const result = transformSync(filename, code, {
					lang,
					reactCompiler: { target: '19' },
					sourcemap: true,
					jsx: 'preserve',
				});

				if (result.fatal) {
					const errorMessages = result.errors.flatMap((error) => {
						if (error.severity !== 'Error') return [];

						return [error.codeframe ?? error.message];
					});
					throw new Error(`Failed to compile ${filename}:\n\n${errorMessages.join('\n\n')}`);
				}

				for (const error of result.errors) {
					if (error.severity === 'Advice') continue;
					this.warn(`${filename}: ${error.codeframe ?? error.message}`);
				}

				return { code: result.code, map: result.map };
			},
		},
	};
}

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
