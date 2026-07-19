#!/usr/bin/env tsx

/**
 * Stylesheet assembler (T2).
 *
 * Combines Panda's ejected output into a single preview stylesheet whose cascade
 * layers match the canonical Luke UI order. Panda has no native `box` layer, so
 * we take Panda's `utilities` output (currently the sole box slice) and re-wrap
 * it as `@layer box`.
 *
 * Config recipe base/variant CSS emits into its own split file
 * (`styles/recipes.css`) already wrapped in `@layer recipes`;
 * compound-variant CSS is the exception. Panda resolves `compoundVariants`
 * through atomic css() classes, so it lands in `utilities.css` next to the
 * Box slice and rides the rename into `@layer box`. That is cascade-correct
 * (box sits above recipes, so compounds still beat base/variant rules) but
 * means `utilities.css` is the Box slice plus recipe compound atomics; when
 * T4/T5 introduce real one-off utilities, box will still need its own
 * separation.
 *
 * The full layer contract that trade-off implies:
 *
 * - `box` carries the Box slice plus recipe compound-variant atomics.
 * - `utilities` sits above `box`, so consumer/blessed overrides always beat
 *   both the Box slice and the compound atomics.
 * - Disjointness rule: a recipe that composes and overrides another recipe
 *   from within `@layer recipes` can never beat a compound-variant atomic in
 *   `box`, so recipe-on-recipe override properties must stay disjoint from
 *   the composed recipe's compound-variant properties.
 *
 * `assembled-stylesheet.test.ts` pins this contract against the generated
 * output.
 *
 * VE still owns reset/base styles, so Panda's reset.css is deliberately
 * excluded. Panda global rules that explicitly target `@layer recipes` are
 * included alongside config recipes. Panda's tokens.css is the Panda→Luke
 * token alias bridge that recipe and box CSS depend on.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lukeLayerOrder } from '../src/styles/layer-order.js';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const pandaStylesDir = `${packageRoot}styled-system/styles`;
const vanillaExtractStylesheet = `${packageRoot}dist/stylesheet.css`;
const assembledOutput = `${packageRoot}styled-system/assembled.css`;

export interface AssembleOptions {
	/**
	 * Append VE's shipped `dist/stylesheet.css` verbatim (preview only). Skipped
	 * silently when the build artifact is absent so the assembler still succeeds
	 * from `generate` output alone.
	 */
	includeVanillaExtract?: boolean;
	/** Override the Panda split-CSS directory (defaults to package styled-system/styles). */
	pandaStylesDir?: string;
	/** Override the VE stylesheet path. */
	vanillaExtractStylesheet?: string;
}

/**
 * Build the assembled stylesheet string. Reads Panda's split output from disk,
 * so `panda cssgen --splitting` must have run first.
 */
export function assembleStylesheet(options: AssembleOptions = {}): string {
	const stylesDir = options.pandaStylesDir ?? pandaStylesDir;
	const vePath = options.vanillaExtractStylesheet ?? vanillaExtractStylesheet;

	const sections: Array<string> = [];

	// Line 1: the single combined layer-order declaration, from the shared source
	// of truth. Renders exactly: @layer reset, base, tokens, recipes, box, utilities;
	sections.push(`@layer ${lukeLayerOrder.join(', ')};`);

	// The Panda→Luke token alias bridge: `@layer tokens` maps every `--colors-*`
	// (etc.) Panda variable to its `var(--luke-*)` source. Recipe and box CSS
	// resolve through these aliases; VE still owns the `--luke-*` values
	// themselves.
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

	// `globalCss` emits through Panda's base stylesheet even when a rule
	// declares its own layer. Keep explicitly recipe-layered global rules at
	// the top level so they retain the intended cascade position.
	const globalPath = `${stylesDir}/global.css`;
	if (existsSync(globalPath)) {
		const recipeGlobals = extractLayer(readFileSync(globalPath, 'utf8'), 'recipes');
		if (recipeGlobals) sections.push(recipeGlobals);
	}

	// Panda utilities = the box slice plus recipe compound-variant atomics (see header).
	// Re-wrap the `@layer utilities` block as `@layer box`. Compounds stay cascade-correct there because box sits above recipes.
	const utilitiesPath = `${stylesDir}/utilities.css`;
	if (existsSync(utilitiesPath)) {
		const utilities = readFileSync(utilitiesPath, 'utf8').trim();
		const box = utilities.replace(/@layer\s+utilities\b/, '@layer box');
		sections.push(box);
	}

	// Optional VE preview: appended verbatim, purely to eyeball the combined
	// result. Never required, because the build owns the real VE stylesheet.
	if (options.includeVanillaExtract) {
		if (existsSync(vePath)) {
			sections.push(`/* --- vanilla-extract dist/stylesheet.css (preview) --- */`);
			sections.push(readFileSync(vePath, 'utf8').trim());
		} else {
			sections.push(
				`/* vanilla-extract dist/stylesheet.css not found (build artifact); skipped */`,
			);
		}
	}

	return `${sections.join('\n\n')}\n`;
}

function extractLayer(css: string, layer: string): string | undefined {
	const start = css.indexOf(`@layer ${layer} {`);
	if (start === -1) return undefined;

	let depth = 0;
	for (let index = start; index < css.length; index += 1) {
		const character = css[index];
		if (character === '{') depth += 1;
		if (character !== '}' || depth === 0) continue;
		depth -= 1;
		if (depth === 0) return css.slice(start, index + 1).trim();
	}

	throw new Error(`Unclosed @layer ${layer} block in Panda global CSS.`);
}

function main(): void {
	const css = assembleStylesheet({ includeVanillaExtract: true });
	writeFileSync(assembledOutput, css, 'utf8');
	process.stdout.write(`Wrote styled-system/assembled.css (${css.length} bytes)\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	main();
}
