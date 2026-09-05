import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformAsync } from '@babel/core';
import type { FileResult, PluginItem } from '@babel/core';
import stylexBabelPlugin from '@stylexjs/babel-plugin';
import type { Rule } from '@stylexjs/babel-plugin';
import type { Options as RollupOptions } from '@vanilla-extract/rollup-plugin';
import { readFile, readdir } from 'node:fs/promises';
import type { Plugin } from 'vite-plus';

/**
 * `esbuild` is a transitive dependency (via `vite`/`@vanilla-extract/rollup-plugin`), not a direct
 * one, so its types aren't safe to import by name. `@vanilla-extract/rollup-plugin`'s own `Options`
 * type re-exports the exact esbuild shape this module needs to build, so borrow it from there
 * instead of adding an undeclared dependency.
 */
type StylexEsbuildPlugin = NonNullable<RollupOptions['esbuildOptions']>['plugins'] extends
	| ReadonlyArray<infer EsbuildPlugin>
	| undefined
	? EsbuildPlugin
	: never;

/** Shared StyleX transforms and cascade-layer handling for package builds and dev tools. */

export const workspaceRoot = fileURLToPath(new URL('../../../', import.meta.url));

const stylexLayerConfig = {
	before: ['reset', 'theme', 'base'],
	after: ['utilities'],
	prefix: 'recipes',
} as const;

/** An `@layer name;` statement on its own line, which StyleX re-emits per chunk. */
const EMPTY_LAYER_STATEMENT_PATTERN = /^@layer [^,{]+;\n/gm;

/** The combined cascade-layer order statement StyleX emits at the head of its output. */
const LAYER_HEADER_PATTERN = /^\n?@layer ([^;]+);/;

/** A single leading newline. */
const LEADING_NEWLINE_PATTERN = /^\n/;

/** A `.ts`/`.tsx`/`.js`/`.jsx` module, excluding declaration files. Mirrors `vite.config.ts`'s `sourceModule`. */
const STYLEX_ELIGIBLE_MODULE_PATTERN = /(?<!\.d)\.[cm]?[jt]sx?$/;

/** A browser, visual, or unit test module, or a Storybook story: never a production module. */
const NON_PRODUCTION_MODULE_PATTERN = /\.(?:browser|visual|test|stories)\.[cm]?[jt]sx?$/;

/** A StyleX const/token module, e.g. `tokens.stylex.ts`. */
const STYLEX_TOKENS_MODULE_PATTERN = /\.stylex\.ts$/;

/** Return the shared StyleX Babel options for each transform call. */
function stylexBabelOptions(): PluginItem {
	return stylexBabelPlugin.withOptions({
		dev: false,
		propertyValidationMode: 'throw',
		unstable_moduleResolution: { type: 'commonJS', rootDir: workspaceRoot },
	});
}

function buildAuthoritativeLayerOrder(priorityLayers: Array<string>): string {
	return `@layer ${[...stylexLayerConfig.before, ...priorityLayers, ...stylexLayerConfig.after].join(', ')};`;
}

function stripRedundantEmptyLayerStatements(css: string): string {
	return css.replace(EMPTY_LAYER_STATEMENT_PATTERN, '');
}

function splitStylexLayerHeader(stylexCss: string): {
	authoritativeLayerOrder: string;
	stylexBody: string;
} {
	const match = stylexCss.match(LAYER_HEADER_PATTERN);
	if (match == null || match[1] == null) {
		throw new Error('Expected StyleX to emit a combined cascade-layer order statement.');
	}

	const priorityLayers = match[1].split(',').flatMap((layer) => {
		const name = layer.trim();
		if (!name.startsWith(`${stylexLayerConfig.prefix}.priority`)) return [];
		return [name];
	});

	return {
		authoritativeLayerOrder: buildAuthoritativeLayerOrder(priorityLayers),
		stylexBody: stylexCss.slice(match[0].length).replace(LEADING_NEWLINE_PATTERN, ''),
	};
}

/**
 * Extracts CSS for a set of collected rules, in the shared cascade-layer config, split into the
 * authoritative `@layer` order statement and the StyleX rule body it precedes.
 */
function processRules(rules: ReadonlyArray<Rule>): {
	authoritativeLayerOrder: string;
	stylexBody: string;
} {
	const stylexCss = stylexBabelPlugin.processStylexRules([...rules], {
		useLayers: stylexLayerConfig,
	});
	return splitStylexLayerHeader(stylexCss);
}

/**
 * Runs the StyleX Babel transform on `code` and returns both the transformed module and the
 * collected rules (if any), or `null` when the module contains no StyleX declarations.
 */
async function transformStylex(
	code: string,
	id: string,
): Promise<{ code: string; map: TransformSourceMap; rules: Array<Rule> | undefined } | null> {
	const filename = id.split('?')[0] ?? id;

	// Skip non-source files, dependencies, and files that do not import StyleX before parsing.
	if (
		!STYLEX_ELIGIBLE_MODULE_PATTERN.test(filename) ||
		id.includes('/node_modules/') ||
		!code.includes('@stylexjs/stylex')
	) {
		return null;
	}

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
		plugins: [stylexBabelOptions()],
		sourceMaps: true,
	});

	if (result?.code == null) {
		throw new Error(
			`StyleX could not compile ${filename}. Every \`stylex\` declaration must be statically extractable.`,
		);
	}

	const meta = result.metadata as { stylex?: Array<Rule> };

	return { code: result.code, map: toRolldownSourceMap(result.map), rules: meta.stylex };
}

/** Collects the complete StyleX rule set before any virtual stylesheet is served. */
async function loadSourceRules(includeTests: boolean): Promise<Array<Rule>> {
	const sourceRoot = join(workspaceRoot, 'packages/@luke-ui/react/src');
	const filenames = await findSourceModules(sourceRoot, includeTests);
	const perFileRules = await Promise.all(
		filenames.map(async (filename) => {
			const code = await readFile(filename, 'utf8');
			const result = await transformStylex(code, filename);
			return result?.rules ?? [];
		}),
	);
	return perFileRules.flat();
}

export async function createStylexStylesheet(includeTests: boolean): Promise<string> {
	const { authoritativeLayerOrder, stylexBody } = processRules(await loadSourceRules(includeTests));
	return `${authoritativeLayerOrder}\n/* stylex */\n${stylexBody}`;
}

async function findSourceModules(directory: string, includeTests: boolean): Promise<Array<string>> {
	const entries = await readdir(directory, { withFileTypes: true });
	const filenames = await Promise.all(
		entries.map(async (entry) => {
			const filename = join(directory, entry.name);
			if (entry.isDirectory()) return findSourceModules(filename, includeTests);
			if (!STYLEX_ELIGIBLE_MODULE_PATTERN.test(filename)) return [];
			if (!includeTests && NON_PRODUCTION_MODULE_PATTERN.test(filename)) return [];
			return [filename];
		}),
	);
	return filenames.flat();
}

// ---------------------------------------------------------------------------
// Vanilla Extract esbuild plugin (compiles StyleX token modules inside VE's own bundle-and-run step)
// ---------------------------------------------------------------------------

/**
 * `vp pack`'s `@vanilla-extract/rollup-plugin` compiles every `.css.ts` file and its whole static
 * import graph through Vanilla Extract's own esbuild-based bundle-and-run step (`compile()`), not
 * through the project's normal Rollup plugin pipeline — so `esbuildOptions.plugins` is the only
 * hook available for that step. (`@vanilla-extract/vite-plugin`, the counterpart used by Vitest and
 * Storybook, has a parallel problem with a different fix: see `stylexVanillaExtractPluginFilter`.)
 * That esbuild pass never runs the StyleX Babel transform, so when the import graph reaches
 * `tokens.stylex.ts`, it evaluates the raw source: StyleX's runtime `unstable_defineConstsNested` is
 * a stub that throws by design, because it expects `@stylexjs/babel-plugin` to have already
 * rewritten the call away.
 *
 * This plugin closes that gap by transforming `.stylex.ts` files with the same Babel options
 * `transformStylex` uses, before esbuild ever sees the runtime call. Only `.stylex.ts` (not the
 * broader `STYLEX_ELIGIBLE_MODULE_PATTERN`) needs it: `tokens.stylex.ts` is the only module in a
 * `.css.ts` import graph that calls a StyleX define function at module scope, so it's the only one
 * whose evaluation trips the stub. Ordinary `stylex.create()` call sites in component modules
 * aren't reached by this pass at all — VE's `.css.ts` graphs never import them.
 */
export function createStylexEsbuildPlugin(): StylexEsbuildPlugin {
	return {
		name: 'stylex-for-vanilla-extract',
		setup(build) {
			build.onLoad({ filter: STYLEX_TOKENS_MODULE_PATTERN }, async (args: { path: string }) => {
				const code = await readFile(args.path, 'utf8');
				const result = await transformAsync(code, {
					babelrc: false,
					configFile: false,
					filename: args.path,
					parserOpts: { plugins: ['typescript'] },
					plugins: [stylexBabelOptions()],
					sourceMaps: false,
				});

				if (result?.code == null) {
					throw new Error(`StyleX could not compile ${args.path} for Vanilla Extract.`);
				}

				return { contents: result.code, loader: 'ts' };
			});
		},
	};
}

// ---------------------------------------------------------------------------
// Pack-time plugin (production build; appends to the emitted `stylesheet.css` asset)
// ---------------------------------------------------------------------------

/**
 * Pack-time StyleX plugin: transforms every module that uses `@stylexjs/stylex`, then appends CSS
 * from a complete source scan to the `stylesheet.css` asset Vanilla Extract emits.
 */
export function createStylexPackPlugin(): Plugin {
	let sourceRules: Promise<Array<Rule>>;

	return {
		name: 'stylex-pack',
		buildStart() {
			sourceRules = loadSourceRules(false);
		},
		async transform(code, id) {
			const result = await transformStylex(code, id);
			if (result === null) return null;
			return { code: result.code, map: result.map };
		},
		async generateBundle(_options, bundle) {
			const stylesheet = bundle['stylesheet.css'];
			if (stylesheet?.type !== 'asset') return;

			const rules = await sourceRules;
			const vanillaCss = stripRedundantEmptyLayerStatements(stylesheet.source.toString());

			if (rules.length === 0) {
				stylesheet.source = `${buildAuthoritativeLayerOrder([])}\n${vanillaCss}`;
				return;
			}

			const { authoritativeLayerOrder, stylexBody } = processRules(rules);
			stylesheet.source = `${authoritativeLayerOrder}\n${vanillaCss}\n/* stylex */\n${stylexBody}`;
		},
	};
}

// ---------------------------------------------------------------------------
// Dev/test plugin (Vitest, Storybook, docs; serves `virtual:luke-stylex.css`)
// ---------------------------------------------------------------------------

const STYLEX_VIRTUAL_CSS_ID = 'virtual:luke-stylex.css';
const RESOLVED_STYLEX_VIRTUAL_CSS_ID = `\0${STYLEX_VIRTUAL_CSS_ID}`;

/** Name of the plugin `createStylexDevPlugin` returns, for `stylexVanillaExtractPluginFilter`. */
const STYLEX_DEV_PLUGIN_NAME = 'stylex-dev';

/** Keep the StyleX plugin in Vanilla Extract's internal Vite plugin list. */
export function stylexVanillaExtractPluginFilter(plugin: { name: string }): boolean {
	return plugin.name === STYLEX_DEV_PLUGIN_NAME;
}

/** Transform StyleX modules and serve the extracted CSS in dev and test builds. */
export function createStylexDevPlugin(): Plugin {
	let sourceRules: Promise<Array<Rule>> | undefined;

	return {
		name: STYLEX_DEV_PLUGIN_NAME,
		resolveId(id) {
			if (id === STYLEX_VIRTUAL_CSS_ID) return RESOLVED_STYLEX_VIRTUAL_CSS_ID;
			return null;
		},
		async load(id) {
			if (id !== RESOLVED_STYLEX_VIRTUAL_CSS_ID) return null;
			sourceRules ??= loadSourceRules(true);
			const { authoritativeLayerOrder, stylexBody } = processRules(await sourceRules);
			return `${authoritativeLayerOrder}\n/* stylex */\n${stylexBody}`;
		},
		async transform(code, id) {
			const result = await transformStylex(code, id);
			if (result === null) return null;
			return { code: result.code, map: result.map };
		},
		hotUpdate({ file, modules }) {
			// Documentation and other non-StyleX files do not change the extracted rules.
			if (!STYLEX_ELIGIBLE_MODULE_PATTERN.test(file)) return;

			sourceRules = undefined;

			const virtualModule = this.environment.moduleGraph.getModuleById(
				RESOLVED_STYLEX_VIRTUAL_CSS_ID,
			);
			if (virtualModule === undefined) return;

			// The changed module does not import the virtual stylesheet, so add it explicitly.
			return [...modules, virtualModule];
		},
	};
}

/** Extract the transform handler type without importing Vite Plus's unrelated result type. */
type TransformHandler = Extract<NonNullable<Plugin['transform']>, (...args: never) => unknown>;
type TransformHookResult = Awaited<ReturnType<TransformHandler>>;
type TransformSourceMap = Exclude<TransformHookResult, string | null | undefined | void>['map'];

/** Convert Babel's source-map shape to the mutable shape expected by Rolldown. */
function toRolldownSourceMap(map: FileResult['map']): TransformSourceMap {
	if (map === null) return null;

	return {
		file: map.file,
		mappings: map.mappings,
		names: [...map.names],
		sourceRoot: map.sourceRoot,
		sources: [...map.sources],
		sourcesContent: map.sourcesContent === undefined ? undefined : [...map.sourcesContent],
		version: map.version,
		x_google_ignoreList: map.ignoreList === undefined ? undefined : [...map.ignoreList],
	};
}
