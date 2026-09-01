import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformAsync } from '@babel/core';
import type { FileResult } from '@babel/core';
import stylexBabelPlugin from '@stylexjs/babel-plugin';
import type { Rule } from '@stylexjs/babel-plugin';
import { readFile, readdir } from 'node:fs/promises';
import type { Plugin } from 'vite-plus';

/**
 * Shared StyleX handling for every pipeline that resolves `@luke-ui/react` to source: `vp pack`
 * (production build), Vitest (unit/browser/visual), Storybook, and the docs app. Each pipeline
 * runs the same Babel transform over the same source files, so this module is the one place the
 * transform options and the cascade-layer config live.
 *
 * `createStylexPackPlugin` appends the extracted StyleX CSS to the emitted `stylesheet.css` asset
 * in `generateBundle`. `createStylexDevPlugin` is the dev/test counterpart: those pipelines have
 * no `stylesheet.css` asset to append to, so they serve the same extracted CSS through
 * `virtual:luke-stylex.css`. Both declare the complete authoritative `@layer` order from a full
 * source scan, not from incrementally discovered modules.
 */

export const workspaceRoot = fileURLToPath(new URL('../../../', import.meta.url));

const stylexLayerConfig = {
	before: ['reset', 'theme'],
	after: ['structural', 'utilities'],
	prefix: 'luke.sx',
} as const;

/** An `@layer name;` statement on its own line, which StyleX re-emits per chunk. */
const EMPTY_LAYER_STATEMENT_PATTERN = /^@layer [^,{]+;\n/gm;

/** The combined cascade-layer order statement StyleX emits at the head of its output. */
const LAYER_HEADER_PATTERN = /^\n?@layer ([^;]+);/;

/** A single leading newline. */
const LEADING_NEWLINE_PATTERN = /^\n/;

/** A `.ts`/`.tsx`/`.js`/`.jsx` module, excluding declaration files. Mirrors `vite.config.ts`'s `sourceModule`. */
const STYLEX_ELIGIBLE_MODULE_PATTERN = /(?<!\.d)\.[cm]?[jt]sx?$/;

/** A browser, visual, or unit test module. */
const TEST_MODULE_PATTERN = /\.(?:browser|visual|test)\.[cm]?[jt]sx?$/;

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

	// Cheap gates, cheapest first: a non-JS/TS file (e.g. `package.json`, which itself lists
	// `@stylexjs/stylex` as a dependency) is never eligible; `node_modules` is excluded because a
	// dev server's optimized-deps chunk for `@stylexjs/stylex` itself contains that string (its
	// own module specifier), which would otherwise wrongly feed Vite's pre-bundled dependency
	// output back through the StyleX Babel plugin; and parsing every remaining module through
	// Babel to find the few that use StyleX would roughly double build time, hence the substring
	// check before ever invoking Babel.
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
			if (!includeTests && TEST_MODULE_PATTERN.test(filename)) return [];
			return [filename];
		}),
	);
	return filenames.flat();
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

/**
 * Dev/test StyleX plugin: transforms JS the same way the pack plugin does, and serves the complete
 * extracted CSS — including the same authoritative `@layer` order — from `virtual:luke-stylex.css`.
 * Layer names and StyleX rules come from a full source scan (`loadSourceRules`), not from modules
 * Vite has happened to transform so far.
 */
export function createStylexDevPlugin(): Plugin {
	let sourceRules: Promise<Array<Rule>> | undefined;

	return {
		name: 'stylex-dev',
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
	};
}

/**
 * `Plugin['transform']` is an `ObjectHook`, i.e. the handler function or an object wrapping it;
 * this pulls out the function form so its return type's `map` field can be reused below. `vite-plus`
 * exports an unrelated dev-server `TransformResult` under the same name, so it can't be imported directly.
 */
type TransformHandler = Extract<NonNullable<Plugin['transform']>, (...args: never) => unknown>;
type TransformHookResult = Awaited<ReturnType<TransformHandler>>;
type TransformSourceMap = Exclude<TransformHookResult, string | null | undefined | void>['map'];

/**
 * Babel's sourcemap types its array fields as `readonly` and names the ignore-list field
 * differently, neither of which rolldown's `ExistingRawSourceMap` accepts; copy the fields
 * across into that shape with plain mutable arrays.
 */
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
