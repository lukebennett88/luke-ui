import { vars } from '../theme/contract.css.js';

/*
 * Overlays take the enter and exit duration roles rather than the in-place feedback one. Entry
 * decelerates with the standard easing curve, while exit accelerates with the exit curve.
 *
 * A recipe that builds an exit transition must also repeat `transition: none` on each
 * `[data-entering]` and `[data-exiting]` selector under `prefers-reduced-motion: reduce`. Those
 * selectors set their own `transition`, so they outrank the plain class rule and keep animating
 * when only the class rule is reset.
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
