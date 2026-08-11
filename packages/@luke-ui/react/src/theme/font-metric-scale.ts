/**
 * The private numbered typography metric scale behind the public type styles. It is resolved in
 * TypeScript and never emitted, so no `--luke-font-100-*` custom properties exist.
 *
 * The keys are ordinal steps, not encoded pixel values. Multiple public type styles may share one
 * step when they differ by weight or family rather than size. Recipes that need raw metrics for
 * geometry or composite control chrome read this scale directly instead of borrowing a semantic
 * text treatment.
 */

/** An ordinal position on the private typography metric scale. */
export type FontMetricStep = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/** Size, leading, and tracking for one private metric step. */
export type FontMetric = {
	fontSize: string;
	letterSpacing: string;
	lineHeight: string;
};

/** The private typography metric steps, from the smallest ancillary size to display. */
export const FONT_METRIC_SCALE = {
	100: { fontSize: '12px', letterSpacing: '0.0025em', lineHeight: '16px' },
	200: { fontSize: '14px', letterSpacing: '0', lineHeight: '20px' },
	300: { fontSize: '16px', letterSpacing: '0', lineHeight: '24px' },
	400: { fontSize: '18px', letterSpacing: '-0.0025em', lineHeight: '26px' },
	500: { fontSize: '20px', letterSpacing: '-0.005em', lineHeight: '28px' },
	600: { fontSize: '24px', letterSpacing: '-0.00625em', lineHeight: '30px' },
	700: { fontSize: '28px', letterSpacing: '-0.0075em', lineHeight: '36px' },
	800: { fontSize: '35px', letterSpacing: '-0.01em', lineHeight: '40px' },
	900: { fontSize: '60px', letterSpacing: '-0.025em', lineHeight: '60px' },
} as const satisfies Record<FontMetricStep, FontMetric>;
