/**
 * The private typography metric scale behind the public type styles. It is resolved in TypeScript
 * and never emitted, so no `--luke-font-12-*` custom properties exist.
 *
 * Keys are the fixed font sizes in pixel-equivalent design units (16 → 1rem). Multiple public type
 * styles may share one step when they differ by weight or family rather than size. Recipes that need
 * raw metrics for geometry or composite control chrome read this scale directly instead of borrowing
 * a semantic text treatment.
 */

import { rem } from './rem.js';

type FontMetric = {
	fontSize: string;
	letterSpacing: string;
	lineHeight: string;
};

/** The private typography metric steps, from the smallest ancillary size to display. */
export const FONT_METRIC_SCALE = {
	12: { fontSize: rem(12), letterSpacing: '0.0025em', lineHeight: rem(16) },
	14: { fontSize: rem(14), letterSpacing: '0', lineHeight: rem(20) },
	16: { fontSize: rem(16), letterSpacing: '0', lineHeight: rem(24) },
	18: { fontSize: rem(18), letterSpacing: '-0.0025em', lineHeight: rem(26) },
	20: { fontSize: rem(20), letterSpacing: '-0.005em', lineHeight: rem(28) },
	24: { fontSize: rem(24), letterSpacing: '-0.00625em', lineHeight: rem(30) },
	28: { fontSize: rem(28), letterSpacing: '-0.0075em', lineHeight: rem(36) },
	35: { fontSize: rem(35), letterSpacing: '-0.01em', lineHeight: rem(40) },
	60: { fontSize: rem(60), letterSpacing: '-0.025em', lineHeight: rem(60) },
} as const satisfies Record<number, FontMetric>;

/** A key on the private typography metric scale. */
export type FontMetricStep = keyof typeof FONT_METRIC_SCALE;
