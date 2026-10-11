/**
 * Test-only helpers shared by the theme compiler's test files: the bundled themes resolved into the
 * foundations `buildTheme` consumes, plus readers for the rule blocks and declarations it emits.
 *
 * NOT imported by production code.
 */

import interMetrics from '@capsizecss/metrics/inter';
import loraMetrics from '@capsizecss/metrics/lora';
import playfairDisplayMetrics from '@capsizecss/metrics/playfairDisplay';
import type { Oklch } from '../color.js';
import { gamutMapOklch, parseColor } from '../color.js';
import { normalizeTheme } from '../define-theme.js';
import type { ThemeFont } from '../font.js';
import { paperTheme } from './paper.js';
import { tactileTheme } from './tactile.js';

const COMMENT_HEADER_PATTERN = /^\/\*.*\*\/\n\n/;
const VAR_VALUE_PATTERN_CACHE = new Map<string, RegExp>();

function getVarValuePattern(varName: string): RegExp {
	let pattern = VAR_VALUE_PATTERN_CACHE.get(varName);
	if (pattern === undefined) {
		pattern = new RegExp(`${varName}: ([^;]+);`);
		VAR_VALUE_PATTERN_CACHE.set(varName, pattern);
	}
	return pattern;
}

// The bundled themes are authored as `defineTheme` inputs; these engine tests exercise the raw
// `buildTheme` pipeline directly, so resolve each input into the foundation `buildTheme` consumes.
export const tactileFoundation = normalizeTheme(tactileTheme);
export const paperFoundation = normalizeTheme(paperTheme);

/** Parses an authoring colour string the same way `defineTheme` resolves a source colour. */
export function resolvedColor(input: string): Oklch {
	return gamutMapOklch(parseColor(input));
}

/**
 * Splits the generated stylesheet into its five rule blocks: theme-wide, base light, media-query
 * dark, explicit light, and explicit dark. Strips the leading banner comment first, so the split
 * models emitted CSS rules only.
 */
export function splitBlocks(css: string) {
	const withoutBanner = css.replace(COMMENT_HEADER_PATTERN, '');
	const blocks = withoutBanner.split('\n\n').filter((block) => block.trim() !== '');
	if (blocks.length !== 5) throw new Error(`expected 5 rule blocks, found ${blocks.length}`);
	const [themeWide, baseLight, mediaDark, explicitLight, explicitDark] = blocks;
	if (
		themeWide === undefined ||
		baseLight === undefined ||
		mediaDark === undefined ||
		explicitLight === undefined ||
		explicitDark === undefined
	) {
		throw new Error('expected every generated theme rule block to be defined');
	}
	return { baseLight, explicitDark, explicitLight, mediaDark, themeWide };
}

/** Reads one declared custom property's value out of a rule block. */
export function extractValue(block: string, varName: string): string {
	const match = getVarValuePattern(varName).exec(block);
	if (match === null || match[1] === undefined) {
		throw new Error(`missing ${varName} in block`);
	}
	return match[1];
}

/** Inter, the body font of the theme fixtures. 2048 units per em. */
export const interFont: ThemeFont = {
	family: "'Inter', system-ui, sans-serif",
	metrics: interMetrics,
};

/** Lora, a serif whose metrics differ from Inter's. 1000 units per em. */
export const loraFont: ThemeFont = {
	family: "'Lora', serif",
	metrics: loraMetrics,
};

/** Playfair Display, a third font for whole-object replacement checks. */
export const playfairFont: ThemeFont = {
	family: "'Playfair Display', serif",
	metrics: playfairDisplayMetrics,
};

/** A complete `typography` section for test inputs that do not exercise fonts. */
export const testTypography: { fonts: { body: ThemeFont } } = {
	fonts: { body: interFont },
};
