import { vars } from '../../theme/contract.css.js';

/*
 * Overlays take the enter and exit duration roles rather than the in-place feedback one. Entry
 * decelerates with the standard easing curve, while exit accelerates with the exit curve.
 *
 * Under `prefers-reduced-motion: reduce` an overlay keeps its opacity fade and loses movement:
 * recipes transition only `opacity` and set `translate: none` on `[data-entering]` and
 * `[data-exiting]`. The exiting selector sets its own `transition`, so it needs its own
 * reduced-motion value.
 */

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
