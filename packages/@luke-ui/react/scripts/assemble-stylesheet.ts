#!/usr/bin/env tsx

/**
 * Stylesheet assembler (T2).
 *
 * Combines Panda's ejected output into a single preview stylesheet whose cascade
 * layers match the canonical Luke UI order. Panda has no native `box` layer, so
 * we take Panda's `utilities` output (currently the sole box slice) and re-wrap
 * it as `@layer box`.
 *
 * IMPORTANT co-mingling caveat: `styled-system/styles/utilities.css` == the box
 * layer ONLY while the box slice is the sole Panda utility source. Once T4/T5
 * introduce real one-off utilities and recipe-driven utilities, they will land
 * in the SAME `@layer utilities` and this blanket rename would swallow them.
 * At that point box needs a dedicated Panda run (its own outdir) or a marker to
 * separate box classes from genuine utilities.
 *
 * VE still owns reset/base/tokens/global, so Panda's reset.css / global.css /
 * tokens.css are deliberately NOT included here.
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

	// Panda recipes (empty until recipes are defined, but wired for the future).
	const recipesPath = `${stylesDir}/recipes.css`;
	if (existsSync(recipesPath)) {
		sections.push(readFileSync(recipesPath, 'utf8').trim());
	}

	// Panda utilities == the box slice. Re-wrap `@layer utilities` -> `@layer box`.
	const utilitiesPath = `${stylesDir}/utilities.css`;
	if (existsSync(utilitiesPath)) {
		const utilities = readFileSync(utilitiesPath, 'utf8').trim();
		const box = utilities.replace(/@layer\s+utilities\b/, '@layer box');
		sections.push(box);
	}

	// Optional VE preview: appended verbatim, purely to eyeball the combined
	// result. Never required — the build owns the real VE stylesheet.
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

function main(): void {
	const css = assembleStylesheet({ includeVanillaExtract: true });
	writeFileSync(assembledOutput, css, 'utf8');
	process.stdout.write(`Wrote styled-system/assembled.css (${css.length} bytes)\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	main();
}
