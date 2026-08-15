/**
 * Shared hover and pressed mix strengths, plus the CSS and sRGB operations first-party recipes and
 * contrast validation use. Components request `hover` or `pressed`. They do not choose percentages.
 */

import type { Oklch } from './color.js';
import { mixSrgb } from './color.js';

/** Mix strength for each generated interaction state, as a percent of the overlay source. */
export const INTERACTION_OVERLAY_PERCENT = {
	hover: 5,
	pressed: 10,
} as const;

/** A generated interaction state first-party recipes can request. */
export type InteractionOverlayState = keyof typeof INTERACTION_OVERLAY_PERCENT;

/**
 * The `background-color` value for a hover or pressed fill:
 * `color-mix(in srgb, <fill> <100-N>%, <source> <N>%)`.
 */
export function interactionFill(
	fill: string,
	source: string,
	state: InteractionOverlayState,
): string {
	const percent = INTERACTION_OVERLAY_PERCENT[state];
	return `color-mix(in srgb, ${fill} ${100 - percent}%, ${source} ${percent}%)`;
}

/**
 * The same sRGB mix {@link interactionFill} asks the browser to paint. `amount` is the overlay
 * source's share of the mix.
 */
export function mixInteractionSrgb(
	fill: Oklch,
	source: Oklch,
	state: InteractionOverlayState,
): Oklch {
	return mixSrgb(fill, source, INTERACTION_OVERLAY_PERCENT[state] / 100);
}
