#!/usr/bin/env tsx

/**
 * Stylesheet assembler.
 *
 * Combines Panda's ejected output into a single stylesheet whose cascade
 * layers match the canonical Luke UI order. Panda has no native `box` layer, so
 * its utilities output is re-wrapped as `@layer box`.
 *
 * Config recipe base/variant CSS emits into its own split file
 * (`styles/recipes.css`) already wrapped in `@layer recipes`;
 * compound-variant CSS is the exception. Panda resolves `compoundVariants`
 * through atomic css() classes, so it lands in `utilities.css` next to the
 * Box slice and rides the rename into `@layer box`. The `utilities` layer
 * remains available for consumer overrides.
 *
 * Panda owns every section of the shipped stylesheet: reset and base global
 * styles, token aliases, recipes, and the re-layered Box output.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { lukeLayerOrder } from '../src/styles/layer-order.js';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const pandaStylesDir = `${packageRoot}styled-system/styles`;
const publicStylesheet = `${packageRoot}dist/stylesheet.css`;

// T5 emits direct Box values as curated classes and responsive values through
// property/breakpoint variables. Keep the integration sheet near T4's budget
// while allowing that deliberately small Box surface.
const maximumPublicStylesheetRawBytes = 135_000;
const maximumPublicStylesheetGzipBytes = 13_500;

export interface AssembleOptions {
	/** Override the Panda split-CSS directory (defaults to package styled-system/styles). */
	pandaStylesDir?: string;
}

/**
 * A single top-level CSS node: either a block (`prelude { body }`) or a bare
 * statement (`prelude;`), where `body` is `null` for statements. Parsed with
 * brace-depth counting rather than a full CSS grammar because the input here
 * is always Panda's own machine-generated output.
 */
interface CssNode {
	prelude: string;
	body: string | null;
}

/** Parse the top-level nodes of a CSS string (does not recurse into bodies). */
function parseTopLevelNodes(css: string): Array<CssNode> {
	const nodes: Array<CssNode> = [];
	let depth = 0;
	let nodeStart = 0;
	let blockPrelude = '';
	let blockBodyStart = -1;

	for (let index = 0; index < css.length; index++) {
		const char = css[index];
		if (char === '{') {
			if (depth === 0) {
				blockPrelude = css.slice(nodeStart, index).trim();
				blockBodyStart = index + 1;
			}
			depth++;
		} else if (char === '}') {
			depth--;
			if (depth < 0) throw new Error('Unbalanced closing brace while parsing CSS.');
			if (depth === 0) {
				nodes.push({ prelude: blockPrelude, body: css.slice(blockBodyStart, index) });
				nodeStart = index + 1;
			}
		} else if (char === ';' && depth === 0) {
			const prelude = css.slice(nodeStart, index).trim();
			if (prelude.length > 0) nodes.push({ prelude, body: null });
			nodeStart = index + 1;
		}
	}

	if (depth !== 0) throw new Error('Unbalanced opening brace while parsing CSS.');
	const trailing = css.slice(nodeStart).trim();
	if (trailing.length > 0) {
		throw new Error(`Unexpected trailing content while parsing CSS: ${trailing.slice(0, 80)}`);
	}
	return nodes;
}

const namedLayerPattern = /^@layer\s+([\w.-]+)$/;

/**
 * Panda's `globalCss` always emits its output wrapped in a single outer
 * `@layer base { ... }` block (Panda's own "base" preset layer), with the
 * `defineGlobalStyles` `'@layer reset'` / `'@layer base'` / `'@layer recipes'`
 * keys authored in `global-styles.ts` and `loading-skeleton.recipe.ts`
 * surviving as further `@layer <name>` blocks nested *inside* that wrapper,
 * alongside plain declarations such as the `:root { --made-with-panda }`
 * marker. None of that matches the top-level layer names the assembled
 * stylesheet promises (`lukeLayerOrder`), so this hoists each nested
 * `@layer <name>` block up to the top level, and folds the wrapper's other
 * direct children into a top-level `@layer base` block alongside any nested
 * `@layer base` content.
 */
export function hoistGlobalLayers(css: string): string {
	const trimmed = css.trim();
	const topNodes = parseTopLevelNodes(trimmed);
	const [wrapper] = topNodes;
	if (topNodes.length !== 1 || wrapper === undefined || wrapper.body === null) {
		throw new Error(
			`Expected global.css to contain exactly one top-level "@layer base { ... }" block, ` +
				`found ${topNodes.length} top-level node(s): ` +
				`${topNodes.map((node) => node.prelude || '(statement)').join(', ') || '(none)'}.`,
		);
	}

	if (wrapper.prelude !== '@layer base') {
		throw new Error(
			`Expected global.css's top-level block to be "@layer base", found "${wrapper.prelude}".`,
		);
	}
	const wrapperBody = wrapper.body;

	const directChildren: Array<string> = [];
	const namedLayers = new Map<string, Array<string>>();

	for (const node of parseTopLevelNodes(wrapperBody)) {
		const layerMatch = node.body !== null ? namedLayerPattern.exec(node.prelude) : null;
		const layerName = layerMatch?.[1];
		if (layerMatch && layerName !== undefined) {
			const existing = namedLayers.get(layerName) ?? [];
			existing.push(node.body ?? '');
			namedLayers.set(layerName, existing);
		} else if (node.body !== null) {
			directChildren.push(`${node.prelude} {${node.body}}`);
		} else {
			directChildren.push(`${node.prelude};`);
		}
	}

	const unexpectedNames = [...namedLayers.keys()].filter(
		(name) => !(lukeLayerOrder as ReadonlyArray<string>).includes(name),
	);
	if (unexpectedNames.length > 0) {
		throw new Error(
			`global.css's "@layer base" wrapper contains unexpected nested layer(s): ${unexpectedNames.join(', ')}.`,
		);
	}

	// Fold the wrapper's direct (non-@layer) children into the base bucket,
	// direct children first, then any nested @layer base content.
	const baseParts = [...directChildren, ...(namedLayers.get('base') ?? [])];
	if (baseParts.length > 0) namedLayers.set('base', baseParts);
	else namedLayers.delete('base');

	const orderedNames = lukeLayerOrder.filter((name) => namedLayers.has(name));
	return orderedNames
		.map((name) => `@layer ${name} {\n${namedLayers.get(name)!.join('\n\n')}\n}`)
		.join('\n\n');
}

/**
 * Build the assembled stylesheet string. Reads Panda's split output from disk,
 * so `panda cssgen --splitting` must have run first.
 */
export function assembleStylesheet(options: AssembleOptions = {}): string {
	const stylesDir = options.pandaStylesDir ?? pandaStylesDir;
	const sections: Array<string> = [];

	// Line 1: the single combined layer-order declaration, from the shared source
	// of truth. Renders exactly: @layer reset, base, tokens, recipes, box, utilities;
	sections.push(`@layer ${lukeLayerOrder.join(', ')};`);

	// Panda's ejected preflight also writes reset.css, but with `panda cssgen
	// --splitting` it only ever contains an empty `@layer reset {}` — the real
	// reset rules are authored as global styles instead (see global.css /
	// hoistGlobalLayers below), so reset.css is intentionally never read here.
	const globalPath = `${stylesDir}/global.css`;
	if (existsSync(globalPath)) {
		const rawGlobal = readFileSync(globalPath, 'utf8').trim();
		if (rawGlobal.length > 0) sections.push(hoistGlobalLayers(rawGlobal));
	}

	// The Panda→Luke token alias bridge: `@layer tokens` maps every `--colors-*`
	// (etc.) Panda variable to its `var(--luke-*)` source. Recipe and box CSS
	// resolve through these aliases; generated theme stylesheets own the values.
	const tokensPath = `${stylesDir}/tokens.css`;
	if (existsSync(tokensPath)) {
		sections.push(readFileSync(tokensPath, 'utf8').trim());
	}

	// Config recipes: with `panda cssgen --splitting` this file holds only
	// recipe rules already wrapped in `@layer recipes` (slot recipes use the
	// `recipes.slots` sublayer), either directly or as a barrel of `@import`
	// lines pointing at per-recipe files. Inline any imports so the assembled
	// sheet stays a single file; no re-layering needed.
	const recipesPath = `${stylesDir}/recipes.css`;
	if (existsSync(recipesPath)) {
		const recipes = readFileSync(recipesPath, 'utf8')
			.replace(/@import\s+['"]([^'"]+)['"]\s*;?/g, (_match, specifier: string) => {
				return readFileSync(`${stylesDir}/${specifier}`, 'utf8').trim();
			})
			.trim();
		sections.push(recipes);
	}

	// Panda utilities = the box slice plus recipe compound-variant atomics (see header).
	// Re-wrap the `@layer utilities` block as `@layer box`. Compounds stay cascade-correct there because box sits above recipes.
	const utilitiesPath = `${stylesDir}/utilities.css`;
	if (existsSync(utilitiesPath)) {
		const utilities = readFileSync(utilitiesPath, 'utf8').trim();
		const box = utilities.replace(/@layer\s+utilities\b/, '@layer box');
		sections.push(box);
	}

	return `${sections.join('\n\n')}\n`;
}

function main(): void {
	const output = process.argv.find((argument) => argument.startsWith('--output='));
	const outputPath = output
		? `${packageRoot}${output.slice('--output='.length)}`
		: publicStylesheet;
	const css = assembleStylesheet();

	assertPublicStylesheet(css);
	writeFileSync(outputPath, css, 'utf8');
	process.stdout.write(`Wrote ${outputPath.slice(packageRoot.length)} (${css.length} bytes)\n`);
}

/**
 * A top-level `@layer <name> { ... }` block found while scanning CSS.
 * `recipes.slots` is Panda's slot-recipe sublayer; every check below treats
 * it as `recipes`.
 */
interface LayerBlock {
	prelude: string;
	body: string;
	canonicalName: string;
}

function canonicalLayerName(rawName: string): string {
	return rawName === 'recipes.slots' ? 'recipes' : rawName;
}

/** Find the top-level `@layer <name> { ... }` blocks of a CSS string. */
function findTopLevelLayerBlocks(css: string): Array<LayerBlock> {
	const blocks: Array<LayerBlock> = [];
	for (const node of parseTopLevelNodes(css)) {
		if (node.body === null) continue;
		const match = namedLayerPattern.exec(node.prelude);
		const rawName = match?.[1];
		if (rawName === undefined) continue;
		blocks.push({
			prelude: node.prelude,
			body: node.body,
			canonicalName: canonicalLayerName(rawName),
		});
	}
	return blocks;
}

/** Whether an `@layer <name> { ... }` block is nested anywhere inside `css`. */
function hasNestedNamedLayer(css: string, name: string): boolean {
	for (const node of parseTopLevelNodes(css)) {
		if (node.body === null) continue;
		const match = namedLayerPattern.exec(node.prelude);
		if (match && match[1] === name) return true;
		if (hasNestedNamedLayer(node.body, name)) return true;
	}
	return false;
}

function assertPublicStylesheet(css: string): void {
	const expectedFirstLine = `@layer ${lukeLayerOrder.join(', ')};`;
	const firstLine = css.split('\n')[0];
	if (firstLine !== expectedFirstLine) {
		throw new Error(
			`Public stylesheet must start with "${expectedFirstLine}", found "${firstLine}".`,
		);
	}

	const topLayerBlocks = findTopLevelLayerBlocks(css.trim());

	for (const block of topLayerBlocks) {
		if (!(lukeLayerOrder as ReadonlyArray<string>).includes(block.canonicalName)) {
			throw new Error(`Public stylesheet has an unexpected top-level layer: ${block.prelude}.`);
		}
	}

	// `utilities` is deliberately absent from the shipped sheet (Panda's
	// `utilities.css` is re-layered as `box`, see assembleStylesheet above).
	const requiredTopLevelLayers = ['reset', 'base', 'tokens', 'recipes', 'box'] as const;
	for (const name of requiredTopLevelLayers) {
		if (!topLayerBlocks.some((block) => block.canonicalName === name)) {
			throw new Error(`Public stylesheet is missing a top-level "@layer ${name}" block.`);
		}
	}

	const resetBlocks = topLayerBlocks.filter((block) => block.canonicalName === 'reset');
	if (
		!resetBlocks.some((block) =>
			block.body.includes('.luke-ui-reset :where(h1, h2, h3, h4, h5, h6)'),
		)
	) {
		throw new Error(
			'Public stylesheet is missing the DS reset contract inside a top-level "@layer reset" block.',
		);
	}

	const baseBlocks = topLayerBlocks.filter((block) => block.canonicalName === 'base');
	if (!baseBlocks.some((block) => block.body.includes('.luke-ui-theme'))) {
		throw new Error(
			'Public stylesheet is missing the theme-root base contract inside a top-level "@layer base" block.',
		);
	}

	const maskingSelector = '.loading-skeleton:not([data-skeleton-inline]) > * {';
	const recipesBlocks = topLayerBlocks.filter((block) => block.canonicalName === 'recipes');
	const hasMasking = recipesBlocks.some((block) => {
		const maskingStart = block.body.indexOf(maskingSelector);
		if (maskingStart === -1) return false;
		const maskingEnd = block.body.indexOf('}', maskingStart);
		return block.body.slice(maskingStart, maskingEnd).includes('overflow: hidden !important');
	});
	if (!hasMasking) {
		throw new Error(
			'Public stylesheet is missing loading skeleton block masking inside a top-level "@layer recipes" block.',
		);
	}

	// Every top-level layer's *nested* content must be free of `@layer reset`
	// / `@layer base` blocks — those names are only legitimate at the top
	// level. A nested `@layer _base` (Panda's per-recipe base sublayer, see
	// styled-system/styles/recipes/*.css) is unrelated and stays allowed.
	for (const block of topLayerBlocks) {
		if (hasNestedNamedLayer(block.body, 'reset') || hasNestedNamedLayer(block.body, 'base')) {
			throw new Error(
				`Public stylesheet has an @layer reset or @layer base nested inside ${block.prelude}.`,
			);
		}
	}

	const rawBytes = Buffer.byteLength(css);
	if (rawBytes > maximumPublicStylesheetRawBytes) {
		throw new Error(
			`Public stylesheet is ${rawBytes} bytes; maximum is ${maximumPublicStylesheetRawBytes}.`,
		);
	}

	const gzipBytes = gzipSync(css, { level: 9 }).byteLength;
	if (gzipBytes > maximumPublicStylesheetGzipBytes) {
		throw new Error(
			`Public stylesheet is ${gzipBytes} gzip bytes; maximum is ${maximumPublicStylesheetGzipBytes}.`,
		);
	}
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	main();
}
