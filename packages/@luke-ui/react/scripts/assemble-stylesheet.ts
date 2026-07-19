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
 * Build the assembled stylesheet string. Reads Panda's split output from disk,
 * so `panda cssgen --splitting` must have run first.
 */
export function assembleStylesheet(options: AssembleOptions = {}): string {
	const stylesDir = options.pandaStylesDir ?? pandaStylesDir;
	const sections: Array<string> = [];

	// Line 1: the single combined layer-order declaration, from the shared source
	// of truth. Renders exactly: @layer reset, base, tokens, recipes, box, utilities;
	sections.push(`@layer ${lukeLayerOrder.join(', ')};`);

	const globalPath = `${stylesDir}/global.css`;
	if (existsSync(globalPath)) sections.push(readFileSync(globalPath, 'utf8').trim());

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

function assertPublicStylesheet(css: string): void {
	const requiredSections = [
		'@layer reset, base, tokens, recipes, box, utilities;',
		'@layer reset {',
		'@layer base {',
		'@layer tokens {',
		'@layer recipes {',
		'@layer box {',
	];

	for (const section of requiredSections) {
		if (!css.includes(section)) throw new Error(`Public stylesheet is missing ${section}.`);
	}

	const maskingSelector = '.loading-skeleton:not([data-skeleton-inline]) > * {';
	const maskingStart = css.indexOf(maskingSelector);
	const maskingEnd = css.indexOf('}', maskingStart);
	if (
		maskingStart === -1 ||
		!css.slice(maskingStart, maskingEnd).includes('overflow: hidden !important')
	) {
		throw new Error('Public stylesheet is missing loading skeleton block masking.');
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
