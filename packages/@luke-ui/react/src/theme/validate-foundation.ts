/**
 * Shape validation for the {@link ThemeFoundation} the compiler is handed. It sits beside the
 * foundation type it validates, and it aggregates every issue it finds into one error rather than
 * failing on the first: an author fixing a foundation sees the whole list.
 *
 * It runs before any colour is generated, so it is also the guard for every authored-but-unparsed CSS
 * value the pipeline emits verbatim (the scrim, the depth rungs, and the action-control finishes).
 */

import { parseColor } from './color.js';
import type { ThemeFoundation } from './foundation.js';
import { SOURCE_COLOR_FIELDS, themeFontFamilyStacks } from './foundation.js';
import { themeClassName } from './identity.js';

/**
 * Validates the shape of a theme foundation: the theme name, every parseable source colour, the
 * verbatim-emitted CSS values, and the optional typography and radius fields. Throws one error listing
 * every issue found; returns nothing when the foundation is usable.
 */
export function validateFoundation(foundation: ThemeFoundation): void {
	const issues: Array<string> = [];
	try {
		themeClassName(foundation.name);
	} catch (error) {
		issues.push(`name: ${errorMessage(error)}`);
	}
	for (const mode of ['light', 'dark'] as const) {
		const modeFoundation = foundation[mode];
		for (const field of SOURCE_COLOR_FIELDS) {
			const value = modeFoundation.color[field];
			if (value === undefined) continue;
			try {
				parseColor(value);
			} catch (error) {
				issues.push(`${mode}.color.${field}: ${errorMessage(error)}`);
			}
		}
		if (isUnsafeCssValue(modeFoundation.color.scrim)) {
			issues.push(`${mode}.color.scrim: must be a non-empty CSS colour value`);
		}
		for (const [name, value] of Object.entries(modeFoundation.depth)) {
			if (isUnsafeCssValue(value)) {
				issues.push(`${mode}.depth.${name}: must be a non-empty CSS box-shadow value`);
			}
		}
		for (const [name, value] of Object.entries(modeFoundation.actionControlFinish)) {
			if (isUnsafeCssValue(value)) {
				issues.push(
					`${mode}.actionControlFinish.${name}: must be a non-empty CSS background-image value`,
				);
			}
		}
	}
	const fontFamily = foundation.typography?.fontFamily;
	if (fontFamily !== undefined && !(fontFamily in themeFontFamilyStacks)) {
		issues.push(`typography.fontFamily: "${fontFamily}" is not a curated font-family choice`);
	}
	const fontWeight = foundation.typography?.fontWeight;
	if (fontWeight !== undefined) {
		for (const role of ['body', 'label', 'heading', 'emphasis'] as const) {
			const value = fontWeight[role];
			if (value === undefined) continue;
			if (!Number.isFinite(value) || value < 1 || value > 1000) {
				issues.push(`typography.fontWeight.${role}: must be a number between 1 and 1000`);
			}
		}
	}
	if (foundation.radius !== undefined) {
		for (const role of ['detail', 'control', 'surface', 'overlay'] as const) {
			const value = foundation.radius[role];
			if (value === undefined) continue;
			if (!Number.isFinite(value) || value < 0) {
				issues.push(`radius.${role}: must be a number of pixels, 0 or greater`);
			}
		}
	}
	if (issues.length > 0) {
		throw new Error(`Invalid theme foundation:\n${issues.join('\n')}`);
	}
}

/**
 * Whether a value is unsafe to emit verbatim into the generated stylesheet: anything other than a
 * non-empty string, or a string containing a statement-breaking character (`;`, `{`, `}`). Shared by
 * every authored-but-unparsed CSS value — the depth box-shadow rungs, the action-control-finish
 * background-images, and the scrim colour (deliberately excluded from OKLCH colour parsing because
 * its alpha channel does not fit that pattern) — so the rule has one home. Checking `typeof value`
 * rather than assuming a string keeps this guard correct even when a caller other than `defineTheme`
 * hands `buildTheme` a foundation with a rung explicitly set to `undefined`.
 */
function isUnsafeCssValue(value: unknown): boolean {
	return typeof value !== 'string' || value.trim() === '' || /[;{}]/.test(value);
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
