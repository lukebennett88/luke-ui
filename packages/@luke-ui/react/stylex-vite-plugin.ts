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
 * `createStylexPackPlugin` reproduces the pack-time behaviour exactly as it ran when it lived
 * inline in `vite.config.ts`: it appends the extracted StyleX CSS to the emitted `stylesheet.css`
 * asset in `generateBundle`. `createStylexDevPlugin` is the dev/test counterpart: nothing in
 * those pipelines emits a `stylesheet.css` asset to append to, so it serves the same extracted CSS
 * through a virtual module a setup file can import directly.
 */

export const workspaceRoot = fileURLToPath(new URL('../../../', import.meta.url));

const stylexLayerConfig = {
	before: ['reset', 'theme'],
	after: ['recipes', 'structural', 'utilities'],
	prefix: 'luke.sx',
} as const;

function buildAuthoritativeLayerOrder(priorityLayers: Array<string>): string {
	return `@layer ${[...stylexLayerConfig.before, ...priorityLayers, ...stylexLayerConfig.after].join(', ')};`;
}

function stripRedundantEmptyLayerStatements(css: string): string {
	return css.replace(/^@layer [^,{]+;\n/gm, '');
}

function splitStylexLayerHeader(stylexCss: string): {
	authoritativeLayerOrder: string;
	stylexBody: string;
} {
	const match = stylexCss.match(/^\n?@layer ([^;]+);/);
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
		stylexBody: stylexCss.slice(match[0].length).replace(/^\n/, ''),
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

/** A `.ts`/`.tsx`/`.js`/`.jsx` module, excluding declaration files. Mirrors `vite.config.ts`'s `sourceModule`. */
const stylexEligibleModule = /(?<!\.d)\.[cm]?[jt]sx?$/;

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
		!stylexEligibleModule.test(filename) ||
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

/** A rule produced by `stylex.defineConsts` (or its nested variant): carries `constKey`/`constVal` rather than a `ltr` declaration body. */
function isConstantRule(rule: Rule): boolean {
	return rule[1].constKey != null && rule[1].constVal != null;
}

/**
 * Finds every `*.stylex.ts` theming module under `theme/` — the one place a `stylex.defineConsts`
 * (or `unstable_defineConstsNested`) call is allowed to live — and transforms each once, returning
 * only the constant rules it produces.
 *
 * `createStylexDevPlugin` needs this independent of Vite's own module graph: a consumer module's
 * per-file CSS companion (see below) can be requested before Vite has transformed the theming
 * module the consumer imports its constants from, purely because a virtual side-import has no
 * ordering guarantee relative to the module's other imports. Reading and transforming the theming
 * module directly here, once, sidesteps that ordering entirely rather than depending on it.
 */
async function loadConstantRules(): Promise<Array<Rule>> {
	const themeDir = join(workspaceRoot, 'packages/@luke-ui/react/src/theme');
	const entries = await readdir(themeDir, { withFileTypes: true }).catch(() => []);
	const themingFilenames = entries
		.filter((entry) => entry.isFile() && entry.name.endsWith('.stylex.ts'))
		.map((entry) => join(themeDir, entry.name));

	const perFileConstantRules = await Promise.all(
		themingFilenames.map(async (filename) => {
			const code = await readFile(filename, 'utf8');
			if (!code.includes('@stylexjs/stylex')) return [];

			const result = await transformStylex(code, filename);
			return result?.rules === undefined ? [] : result.rules.filter(isConstantRule);
		}),
	);

	return perFileConstantRules.flat();
}

// ---------------------------------------------------------------------------
// Pack-time plugin (production build; appends to the emitted `stylesheet.css` asset)
// ---------------------------------------------------------------------------

/**
 * Pack-time StyleX plugin: transforms every module that uses `@stylexjs/stylex`, collects the
 * resulting rules, and appends the processed CSS to the `stylesheet.css` asset Vanilla Extract's
 * rollup plugin emits, in `generateBundle`.
 */
export function createStylexPackPlugin(): Plugin {
	let stylexRules = new Map<string, Array<Rule>>();

	return {
		name: 'stylex-pack',
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
			const result = await transformStylex(code, id);
			if (result === null) return null;

			// Drop the entry when a module stops producing rules, so a watch rebuild replaces its
			// contribution instead of leaving the previous rules stranded in the map.
			if (result.rules === undefined) stylexRules.delete(id);
			else stylexRules.set(id, result.rules);

			return { code: result.code, map: result.map, meta: { stylex: result.rules } };
		},
		generateBundle(_options, bundle) {
			const stylesheet = bundle['stylesheet.css'];
			if (stylesheet?.type !== 'asset') return;

			const rules = [...stylexRules.values()].flat();
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
// Dev/test plugin (Vitest, Storybook, docs; serves a per-module virtual CSS companion)
// ---------------------------------------------------------------------------

const STYLEX_VIRTUAL_CSS_ID = 'virtual:luke-stylex.css';
const RESOLVED_STYLEX_VIRTUAL_CSS_ID = `\0${STYLEX_VIRTUAL_CSS_ID}`;
/** Query suffix identifying a module's own per-file StyleX CSS companion (see below). */
const OWN_RULES_QUERY = 'luke-stylex-own-rules';

/**
 * Dev/test StyleX plugin: transforms every module that uses `@stylexjs/stylex` the same way the
 * pack plugin does, but a dev server has no `generateBundle` to append the extracted CSS to, and
 * no single fixed point in time all StyleX-bearing modules are guaranteed to have been discovered
 * by. So instead of one shared virtual module aggregating every rule seen so far — whose content
 * would race against modules Vite has not transformed yet — each StyleX-bearing module gets its
 * own per-file virtual CSS companion appended to its OWN transformed code as a side-effecting
 * import. Vite's module graph then orders that CSS import exactly like any other import: it loads
 * before the importing module's body runs, every time, with no shared aggregation to race against.
 *
 * Every companion also prepends the constant rules `loadConstantRules` collects directly from the
 * `*.stylex.ts` theming modules (see that function): a `stylex.create` call that references a
 * `stylex.defineConsts` constant emits an atomic class naming the constant's generated
 * `var(--hash)`, but never the constant's own defining declaration, so a companion whose module
 * uses a constant must carry that constant's definition itself, from wherever it is calculated,
 * not from Vite's own transform order (which offers no ordering guarantee for a virtual
 * side-import relative to the importing module's other imports).
 *
 * `virtual:luke-stylex.css` itself (no query) stays available as a fallback entrypoint a setup
 * file can import unconditionally; on its own it only carries the authoritative `@layer` order
 * (no priority layers yet), matching an empty stylesheet before anything has transformed.
 */
export function createStylexDevPlugin(): Plugin {
	// Per-module rules, so each module's own companion emits only its own CSS — never another
	// module's, and never stale CSS for a module that stopped producing rules.
	const stylexRulesByModule = new Map<string, Array<Rule>>();
	// Computed once and reused for every companion — see `loadConstantRules`.
	let constantRules: Promise<Array<Rule>> | undefined;

	// The PUBLIC specifier a module's source code imports. Only `resolveId`'s return value gets
	// the `\0` prefix marking it pre-resolved; a source-level import specifier never does — Vite's
	// import analysis does not treat a `\0`-prefixed string appearing in source text as resolvable.
	function ownRulesVirtualId(id: string): string {
		return `${STYLEX_VIRTUAL_CSS_ID}?${OWN_RULES_QUERY}=${encodeURIComponent(id)}`;
	}

	return {
		name: 'stylex-dev',
		resolveId(id) {
			if (id === STYLEX_VIRTUAL_CSS_ID || id.startsWith(`${STYLEX_VIRTUAL_CSS_ID}?`)) {
				return `\0${id}`;
			}
			return null;
		},
		async load(id) {
			if (!id.startsWith(RESOLVED_STYLEX_VIRTUAL_CSS_ID)) return null;

			const ownRulesFor = new URL(id.slice(1), 'file:').searchParams.get(OWN_RULES_QUERY);
			const ownRules = ownRulesFor === null ? [] : (stylexRulesByModule.get(ownRulesFor) ?? []);
			if (ownRules.length === 0) return `${buildAuthoritativeLayerOrder([])}\n`;

			constantRules ??= loadConstantRules();
			// Constants this module's own rules already carry (it may itself be a theming module)
			// are excluded from the prepended set so they are not duplicated.
			const ownConstantKeys = new Set(
				ownRules.filter(isConstantRule).map((rule) => rule[1].constKey),
			);
			const prependedConstantRules = (await constantRules).filter(
				(rule) => !ownConstantKeys.has(rule[1].constKey),
			);

			const { authoritativeLayerOrder, stylexBody } = processRules([
				...prependedConstantRules,
				...ownRules,
			]);
			return `${authoritativeLayerOrder}\n/* stylex */\n${stylexBody}`;
		},
		shouldTransformCachedModule({ id, meta }) {
			const { stylex } = meta as { stylex?: Array<Rule> };
			if (stylex !== undefined) stylexRulesByModule.set(id, stylex);
			return false;
		},
		async transform(code, id) {
			const result = await transformStylex(code, id);
			if (result === null) return null;

			// Drop the entry when a module stops producing rules, so a watch rebuild replaces its
			// contribution instead of leaving the previous rules stranded in the map.
			if (result.rules === undefined) stylexRulesByModule.delete(id);
			else stylexRulesByModule.set(id, result.rules);

			// Append the module's own CSS companion as a side-effecting import, so Vite's graph
			// loads it before this module's body runs — no shared aggregation to race against.
			const code_ = `${result.code}\nimport ${JSON.stringify(ownRulesVirtualId(id))};\n`;
			return { code: code_, map: result.map, meta: { stylex: result.rules } };
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
