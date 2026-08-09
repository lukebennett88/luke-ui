/**
 * The private numbered duration scale behind the public `motion.duration` roles. It is resolved in
 * TypeScript and never emitted, so no `--luke-motion-duration-100` custom property exists. Only the
 * role-named durations in `token-values.ts` reach the stylesheet.
 *
 * The keys are ordinal steps, not encoded millisecond values. Step 400 is the fourth step, and it
 * is not 400ms.
 *
 * The scale covers very short interaction feedback through large surface movement, so a new
 * component picks an existing step instead of an invented one-off value. Material spans 50ms to
 * 1000ms. Carbon uses a deliberately non-linear six-step scale of 70, 110, 150, 240, 400, and
 * 700ms, and puts ordinary micro-interactions at roughly 90 to 120ms.
 *
 * Easing gets no numbered counterpart. Curves differ in shape rather than in magnitude, so an
 * ordinal position would be artificial. The easing tokens stay role-named.
 */

/** An ordinal position on the private duration scale. */
type DurationStep = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/** The private duration steps, from the briefest interaction feedback to the longest movement. */
export const MOTION_DURATION_SCALE = {
	100: '50ms',
	200: '100ms',
	300: '150ms',
	400: '200ms',
	500: '250ms',
	600: '300ms',
	700: '400ms',
	800: '500ms',
	900: '700ms',
} as const satisfies Record<DurationStep, string>;
