import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformAsync } from '@babel/core';
import { makeIdFiltersToMatchWithQuery } from '@rolldown/pluginutils';
import stylexBabelPlugin from '@stylexjs/babel-plugin';
import type { Rule } from '@stylexjs/babel-plugin';
import { vanillaExtractPlugin } from '@vanilla-extract/rollup-plugin';
import react from '@vitejs/plugin-react';
import { readdir, rm } from 'node:fs/promises';
import { transformSync } from 'oxc-transform-react';
import type { Plugin } from 'vite-plus';
import { defineConfig } from 'vite-plus';
import packageJson from './package.json' with { type: 'json' };

const recipeEngineSource = fileURLToPath(
	new URL('./src/core/styles/recipe-engine.ts', import.meta.url),
);
const workspaceRoot = fileURLToPath(new URL('../../../', import.meta.url));
const distDir = fileURLToPath(new URL('dist/', import.meta.url));
const preservedDistFiles = new Set(['spritesheet.svg', 'docs', 'themes']);
const assetExports = [
	'./stylesheet.css',
	'./spritesheet.svg',
	'./themes/tactile/stylesheet.css',
	'./themes/paper/stylesheet.css',
];

const stylexLayerConfig = {
	before: ['reset', 'theme'],
	after: ['recipes', 'structural', 'utilities'],
	prefix: 'luke.sx',
} as const;

function buildAuthoritativeLayerOrder(priorityLayers: Array<string>): string {
	const quotedPriorityLayers = priorityLayers.map(quoteLayerNameIfNeeded);
	return `@layer ${[...stylexLayerConfig.before, ...quotedPriorityLayers, ...stylexLayerConfig.after].join(', ')};`;
}

/** Dotted idents are nested layer paths; quote them so StyleX priority layers stay flat. */
function quoteLayerNameIfNeeded(layerName: string): string {
	return layerName.includes('.') ? `"${layerName}"` : layerName;
}

function quoteStylexLayerNames(stylexCss: string): string {
	return stylexCss.replace(/@layer (luke\.sx\.priority\d+)/g, '@layer "$1"');
}

function splitStylexLayerHeader(stylexCss: string): {
	authoritativeLayerOrder: string;
	stylexBody: string;
} {
	const match = stylexCss.match(/^\n?@layer ([^;]+);/);
	if (match == null || match[1] == null) {
		throw new Error('Expected StyleX to emit a combined cascade-layer order statement.');
	}

	const priorityLayers = match[1]
		.split(',')
		.map((name) => name.trim().replaceAll(/^"|"$/g, ''))
		.filter((name) => name.startsWith(`${stylexLayerConfig.prefix}.priority`));

	return {
		authoritativeLayerOrder: buildAuthoritativeLayerOrder(priorityLayers),
		stylexBody: quoteStylexLayerNames(stylexCss.slice(match[0].length).replace(/^\n/, '')),
	};
}

/** Any JS or TS module the React Compiler can read, including `.mjs`/`.cts` variants. */
const sourceModule = /\.[cm]?[jt]sx?$/;
/** Vanilla Extract compiles these to plain style declarations before the plugin sees them. */
const vanillaExtractStyles = /\.css\.ts$/;
const dependency = /\/node_modules\//;

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
			stylexPlugin(),
			reactCompilerPlugin(),
			// @ts-expect-error Vite plugin compatibility
			react({ fastRefresh: true }),
		],
		publint: true,
		sourcemap: true,
	},
});

function stylexPlugin(): Plugin {
	let stylexRules = new Map<string, Array<Rule>>();

	return {
		name: 'stylex',
		buildStart() {
			stylexRules = new Map();
		},
		shouldTransformCachedModule({ id, meta }) {
			// A watch rebuild skips `transform` for unchanged modules, so their rules have to be
			// read back off the cached metadata or they vanish from the stylesheet.
			const { stylex } = meta as { stylex?: Array<Rule> };
			if (stylex !== undefined) stylexRules.set(id, stylex);
			return false;
		},
		async transform(code, id) {
			// Cheap gate: parsing every module through Babel to find the few that use StyleX
			// would roughly double build time.
			if (id.endsWith('.d.ts') || !code.includes('@stylexjs/stylex')) return null;

			const filename = id.split('?')[0] ?? id;

			const result = await transformAsync(code, {
				babelrc: false,
				configFile: false,
				filename,
				parserOpts: {
					plugins:
						filename.endsWith('.tsx') || filename.endsWith('.jsx')
							? ['typescript', 'jsx']
							: ['typescript'],
				},
				plugins: [
					stylexBabelPlugin.withOptions({
						dev: false,
						unstable_moduleResolution: { type: 'commonJS', rootDir: workspaceRoot },
					}),
				],
				sourceMaps: true,
			});

			if (result?.code == null) {
				throw new Error(
					`StyleX could not compile ${filename}. Every \`stylex\` declaration must be statically extractable.`,
				);
			}

			const meta = result.metadata as { stylex?: Array<Rule> };

			// Drop the entry when a module stops producing rules, so a watch rebuild replaces its
			// contribution instead of leaving the previous rules stranded in the map.
			if (meta.stylex === undefined) stylexRules.delete(id);
			else stylexRules.set(id, meta.stylex);

			return { code: result.code, map: result.map, meta };
		},
		generateBundle(_options, bundle) {
			const stylesheet = bundle['stylesheet.css'];
			if (stylesheet?.type !== 'asset') return;

			const rules = [...stylexRules.values()].flat();
			const vanillaCss = stylesheet.source.toString();

			if (rules.length === 0) {
				stylesheet.source = `${buildAuthoritativeLayerOrder([])}\n${vanillaCss}`;
				return;
			}

			const stylexCss = stylexBabelPlugin.processStylexRules(rules, {
				useLayers: stylexLayerConfig,
			});
			const { authoritativeLayerOrder, stylexBody } = splitStylexLayerHeader(stylexCss);

			stylesheet.source = `${authoritativeLayerOrder}\n${vanillaCss}\n/* stylex */\n${stylexBody}`;
		},
	};
}

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
