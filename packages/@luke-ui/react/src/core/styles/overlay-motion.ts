import { vars } from '../../theme/contract.css.js';

/*
 * Overlays take the enter and exit duration roles rather than the in-place feedback one. Entry
 * decelerates with the standard easing curve, while exit accelerates with the exit curve.
 *
 * Under `prefers-reduced-motion: reduce` an overlay keeps its fade and loses its movement: the
 * recipe transitions only `reducedMotionOverlayProperties` and sets `translate: none` on each
 * `[data-entering]` and `[data-exiting]` selector. The `[data-exiting]` selector sets its own
 * `transition`, so it outranks the plain class rule and needs its own reduced-motion transition.
 */

/** The properties an overlay still transitions under reduced motion. Opacity is not movement. */
export const reducedMotionOverlayProperties = ['opacity'];

/** The overlay enter transition for `properties`, joined into one `transition` value. */
export function overlayEnterTransition(properties: ReadonlyArray<string>) {
	return properties
		.map((property) => `${property} ${vars.motion.duration.enter} ${vars.motion.easing.standard}`)
		.join(', ');
}

/** The overlay exit transition for `properties`, joined into one `transition` value. */
export function overlayExitTransition(properties: ReadonlyArray<string>) {
	return properties
		.map((property) => `${property} ${vars.motion.duration.exit} ${vars.motion.easing.exit}`)
		.join(', ');
}
