/**
 * Test-only helpers shared by the theme compiler's test files: the bundled themes resolved into the
 * foundations `buildTheme` consumes, plus readers for the rule blocks and declarations it emits.
 *
 * NOT imported by production code.
 */

import type { Oklch } from '../color.js';
import { gamutMapOklch, parseColor } from '../color.js';
import { normalizeTheme } from '../define-theme.js';
import { paperTheme } from '../foundations/paper.js';
import { tactileTheme } from '../foundations/tactile.js';

// The bundled themes are authored as `defineTheme` inputs; these engine tests exercise the raw
// `buildTheme` pipeline directly, so resolve each input into the foundation `buildTheme` consumes.
export const tactileFoundation = normalizeTheme(tactileTheme);
export const paperFoundation = normalizeTheme(paperTheme);

/** Parses an authoring colour string the same way `defineTheme` resolves a source colour. */
export function resolvedColor(input: string): Oklch {
	return gamutMapOklch(parseColor(input));
}

/**
 * Splits the generated stylesheet into its five rule blocks: identity, base light, media-query
 * dark, explicit light, and explicit dark.
 */
export function splitBlocks(css: string) {
	const blocks = css.split('\n\n').filter((block) => block.trim() !== '');
	if (blocks.length !== 5) throw new Error(`expected 5 rule blocks, found ${blocks.length}`);
	const [identity, baseLight, mediaDark, explicitLight, explicitDark] = blocks;
	if (
		identity === undefined ||
		baseLight === undefined ||
		mediaDark === undefined ||
		explicitLight === undefined ||
		explicitDark === undefined
	) {
		throw new Error('expected every generated theme rule block to be defined');
	}
	return { baseLight, explicitDark, explicitLight, identity, mediaDark };
}

/** Reads one declared custom property's value out of a rule block. */
export function extractValue(block: string, varName: string): string {
	const match = new RegExp(`${varName}: ([^;]+);`).exec(block);
	if (match === null || match[1] === undefined) {
		throw new Error(`missing ${varName} in block`);
	}
	return match[1];
}
