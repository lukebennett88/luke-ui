/** Guards the internal foundation consumed directly by `buildTheme`. */

import { isInvalidOklch } from './color.js';
import type { ThemeFoundation } from './foundation.js';
import { defaultFontWeights, SOURCE_COLOR_FIELDS, SURFACE_ROLES } from './foundation.js';
import { getThemeClassName } from './theme-class-name.js';

/** A low-prominence text link relies on `label` outweighing `body` as its resting cue. */
const MIN_LABEL_WEIGHT_GAP = 100;

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
			if (isInvalidRadius(value)) {
				issues.push(`radius.${role}: must be a number of pixels, 0 or greater`);
			}
		}
	}
	// Unset roles fall back to the defaults, so this sees inherited and default weights too. A weight
	// outside 1-1000 is rejected earlier by `validateThemeChain`, so only the gap is checked here.
	const body = foundation.typography.fontWeight?.body ?? defaultFontWeights.body;
	const label = foundation.typography.fontWeight?.label ?? defaultFontWeights.label;
	if (label - body < MIN_LABEL_WEIGHT_GAP) {
		issues.push(
			`typography.fontWeight.label: must be at least ${MIN_LABEL_WEIGHT_GAP} heavier than typography.fontWeight.body (label is ${label}, body is ${body})`,
		);
	}
	if (issues.length > 0) {
		throw new Error(`Invalid theme foundation:\n${issues.join('\n')}`);
	}
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

const UNSAFE_CSS_VALUE_PATTERN = /[;{}]/;

/** Whether a CSS value is empty or breaks its declaration or block. */
export function isUnsafeCssValue(value: unknown): boolean {
	return typeof value !== 'string' || value.trim() === '' || UNSAFE_CSS_VALUE_PATTERN.test(value);
}

/** Whether a radius is not a finite, non-negative number of pixels. */
export function isInvalidRadius(value: unknown): boolean {
	return typeof value !== 'number' || !Number.isFinite(value) || value < 0;
}
