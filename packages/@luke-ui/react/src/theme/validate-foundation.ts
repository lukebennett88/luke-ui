/**
 * Checks a `ThemeFoundation` before it enters the colour and stylesheet pipeline: kebab-case naming,
 * well-formed source colours, safe-to-emit authored CSS strings, and in-range radius numbers. Fonts
 * and weights are checked per input by `validate-input.ts`, before the `extends` chain is merged.
 * It collects every issue before throwing, so an author fixes the whole foundation at once instead
 * of one error per build.
 */

import type { ThemeFoundation } from './foundation.js';
import { SOURCE_COLOR_FIELDS, SURFACE_ROLES } from './foundation.js';
import { getThemeClassName } from './theme-class-name.js';

/**
 * Whether a value is unsafe to emit verbatim into the generated stylesheet: anything other than a
 * non-empty string, or a string containing a statement-breaking character (`;`, `{`, `}`). Shared by
 * every authored-but-unparsed CSS value — the depth box-shadow rungs, the control-finish
 * background-images, and the backdrop colour (deliberately excluded from OKLCH colour parsing because
 * its alpha channel does not fit that pattern) — so the rule has one home. Checking `typeof value`
 * rather than assuming a string keeps this guard correct even when a caller other than `defineTheme`
 * hands `buildTheme` a foundation with a rung explicitly set to `undefined`.
 */
function isUnsafeCssValue(value: unknown): boolean {
	return typeof value !== 'string' || value.trim() === '' || /[;{}]/.test(value);
}

/** Whether a value is not an OKLCH colour with finite channels and lightness in 0-1. */
function isInvalidOklch(value: unknown): boolean {
	if (typeof value !== 'object' || value === null) return true;
	const { l, c, h } = value as { c?: unknown; h?: unknown; l?: unknown };
	return (
		typeof l !== 'number' ||
		typeof c !== 'number' ||
		typeof h !== 'number' ||
		!Number.isFinite(l) ||
		!Number.isFinite(c) ||
		!Number.isFinite(h) ||
		l < 0 ||
		l > 1 ||
		c < 0
	);
}

/**
 * Throws one `Error` listing every issue found, one per line. Returns nothing when the foundation
 * is well-formed.
 */
export function validateFoundation(foundation: ThemeFoundation): void {
	const issues: Array<string> = [];
	try {
		getThemeClassName(foundation.name);
	} catch (error) {
		issues.push(`name: ${errorMessage(error)}`);
	}
	for (const mode of ['light', 'dark'] as const) {
		const modeFoundation = foundation[mode];
		for (const field of SOURCE_COLOR_FIELDS) {
			const value = modeFoundation.color[field];
			if (isInvalidOklch(value)) {
				issues.push(`${mode}.color.${field}: must be an OKLCH colour with lightness 0-1`);
			}
		}
		for (const role of SURFACE_ROLES) {
			const value = modeFoundation.color.surface[role];
			// Only `base` is required; a missing surface is generated from it.
			if (role !== 'base' && value === undefined) continue;
			if (isInvalidOklch(value)) {
				issues.push(`${mode}.color.surface.${role}: must be an OKLCH colour with lightness 0-1`);
			}
		}
		if (isUnsafeCssValue(modeFoundation.color.backdrop)) {
			issues.push(`${mode}.color.backdrop: must be a non-empty CSS colour value`);
		}
		for (const [name, value] of Object.entries(modeFoundation.depth)) {
			if (isUnsafeCssValue(value)) {
				issues.push(`${mode}.depth.${name}: must be a non-empty CSS box-shadow value`);
			}
		}
		for (const [name, value] of Object.entries(modeFoundation.controlFinish)) {
			if (isUnsafeCssValue(value)) {
				issues.push(
					`${mode}.controlFinish.${name}: must be a non-empty CSS background-image value`,
				);
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

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
