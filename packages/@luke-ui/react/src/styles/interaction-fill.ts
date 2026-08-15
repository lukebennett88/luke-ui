/**
 * Recipe helper for hover and pressed `background-color` values. Mixes the current semantic fill
 * with `color.overlay.hover` or `color.overlay.pressed` at the shared strengths.
 */

import { vars } from '../theme/contract.css.js';
import { interactionFill, type InteractionOverlayState } from '../theme/interaction-overlay.js';

/** `background-color` for a hover or pressed control, mixed from `fill` and the overlay source. */
export function interactionBackground(fill: string, state: InteractionOverlayState): string {
	return interactionFill(fill, vars.color.overlay[state], state);
}
