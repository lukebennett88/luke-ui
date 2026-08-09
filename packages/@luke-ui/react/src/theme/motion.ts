/**
 * The private numbered duration scale behind the public `motion.duration` roles. It is resolved in
 * TypeScript and never emitted, so no `--luke-motion-duration-100` custom property exists.
 *
 * The keys are ordinal steps, not encoded millisecond values. Step 400 is the fourth step, and it
 * is not 400ms. The public semantic roles in `token-values.ts` map onto these steps.
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
