import { fileURLToPath } from 'node:url';
import { makeIdFiltersToMatchWithQuery } from '@rolldown/pluginutils';
import { vanillaExtractPlugin } from '@vanilla-extract/rollup-plugin';
import react from '@vitejs/plugin-react';
import { transformSync } from 'oxc-transform-react';
import type { Plugin } from 'vite-plus';
import { defineConfig } from 'vite-plus';
import packageJson from './package.json' with { type: 'json' };
import { cascadeLayerNames } from './src/core/styles/layer-names.js';

const recipeEngineSource = fileURLToPath(
	new URL('./src/core/styles/recipe-engine.ts', import.meta.url),
);
const workspaceRoot = fileURLToPath(new URL('../../../', import.meta.url));
const assetExports = ['./stylesheet.css', './spritesheet.svg'];

function buildAuthoritativeLayerOrder(): string {
	return `@layer ${cascadeLayerNames.join(', ')};`;
}

function stripRedundantEmptyLayerStatements(css: string): string {
	return css.replace(/^@layer [^,{]+;\n/gm, '');
}

/** Any JS or TS module the React Compiler can read, including `.mjs`/`.cts` variants. */
const sourceModule = /\.[cm]?[jt]sx?$/;
/** Vanilla Extract compiles these to plain style declarations before the plugin sees them. */
const vanillaExtractStyles = /\.css\.ts$/;
const dependency = /\/node_modules\//;
const VANILLA_EXTRACT_CSS_PATTERN = /^@vanilla-extract\/css(?:\/|$)/;

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
		// `generate` writes these to `.generated/`, not `dist/`, so a cache replay of one Turbo task
		// can't overwrite the other's outputs by restoring over a shared directory.
		copy: [{ from: '.generated/spritesheet.svg', to: 'dist' }],
		deps: {
			// Vanilla Extract is build-time only. Keep any stray reference external rather than bundling
			// it, so the packed-consumer harness reports it as an undeclared import.
			neverBundle: [...Object.keys(packageJson.peerDependencies), VANILLA_EXTRACT_CSS_PATTERN],
			onlyBundle: [],
		},
		dts: true,
		entry: {
			'*': ['src/exports/*.ts'],
			'primitives/*': ['src/exports/primitives/*.ts'],
			stylesheet: 'src/core/stylesheet.css.ts',
			'theme/*': ['src/exports/theme/*.ts'],
		},
		exports: {
			customExports: Object.fromEntries(
				assetExports.map((path) => [path, `./dist/${path.slice(2)}`]),
			),
			// Built for extraction; not consumer subpaths.
			exclude: ['stylesheet'],
		},
		format: ['esm'],
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
			authoritativeLayerOrderPlugin(),
			reactCompilerPlugin(),
			// @ts-expect-error Vite plugin compatibility
			react({ fastRefresh: true }),
		],
		publint: true,
		sourcemap: true,
	},
});

function authoritativeLayerOrderPlugin(): Plugin {
	return {
		generateBundle(_options, bundle) {
			const stylesheet = bundle['stylesheet.css'];
			if (stylesheet?.type !== 'asset') return;

			const vanillaCss = stripRedundantEmptyLayerStatements(stylesheet.source.toString());
			stylesheet.source = `${buildAuthoritativeLayerOrder()}\n${vanillaCss}`;
		},
		name: 'authoritative-layer-order',
	};
}

function reactCompilerPlugin(): Plugin {
	return {
		name: 'react-compiler',
		transform: {
			filter: {
				id: {
					exclude: makeIdFiltersToMatchWithQuery([vanillaExtractStyles, dependency]),
					include: makeIdFiltersToMatchWithQuery([sourceModule]),
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
					jsx: 'preserve',
					lang,
					reactCompiler: { target: '19' },
					sourcemap: true,
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
