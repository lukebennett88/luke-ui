/**
 * The private numbered duration scale behind the public `motion.duration` roles. It is resolved here
 * at build time and never emitted, so no `--luke-motion-duration-100` custom property exists. Only
 * the role-named tokens in `token-values.ts` reach the stylesheet.
 *
 * The step numbers are ordinal positions, exactly like the space scale, where `space.800` is `32px`.
 * They order the durations without promising that a number is the value. Steps sit on a 60ms grid,
 * which is roughly four frames at 60Hz and keeps every step a whole number of frames.
 *
 * Easing deliberately gets no numbered layer. A duration is one ordered axis, so numbering it is
 * meaningful, but curves differ in shape rather than in magnitude. Ranking `standard` against `exit`
 * on a single axis would invent an order that does not exist, so the easing tokens stay role-named
 * only.
 */

/** An ordinal position on the private duration scale. */
type DurationStep = 100 | 200 | 300 | 400 | 500;

/** The private duration steps, from the briefest state change to the longest overlay movement. */
export const MOTION_DURATION_SCALE = {
	100: '60ms',
	200: '120ms',
	300: '180ms',
	400: '240ms',
	500: '300ms',
} as const satisfies Record<DurationStep, string>;
