/**
 * The font shape a theme input names. Kept in its own module so the input types and the internal
 * foundation share one definition.
 */

import type { FontMetrics } from '@capsizecss/core';

/** The Capsize metrics Luke UI reads from a font. Any complete {@link FontMetrics} object fits. */
export type ThemeFontMetrics = Pick<
	FontMetrics,
	'ascent' | 'capHeight' | 'descent' | 'familyName' | 'lineGap' | 'unitsPerEm'
> &
	Partial<FontMetrics>;

/** A font a theme names: its CSS stack and the metrics that trim its text. */
export interface ThemeFont {
	/**
	 * An authored CSS `font-family` stack, for example `"'Inter', system-ui, sans-serif"`. The theme
	 * names the font without loading it, so load every font and weight it uses.
	 */
	family: string;
	/**
	 * Capsize metrics for the stack's primary font, such as an object from `@capsizecss/metrics` or
	 * `@capsizecss/unpack`. Text set in another font of the stack is trimmed with these metrics.
	 */
	metrics: ThemeFontMetrics;
}

/** Weights for the four weight roles. */
export type ThemeFontWeights = {
	/**
	 * Weight for body text.
	 * @default 400
	 */
	body?: number;
	/**
	 * Weight for control labels and other dense UI text.
	 * @default 500
	 */
	label?: number;
	/**
	 * Weight for headings.
	 * @default 600
	 */
	heading?: number;
	/**
	 * Weight for emphasised inline text.
	 * @default 700
	 */
	emphasis?: number;
};
