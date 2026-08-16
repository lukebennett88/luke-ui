/**
 * Shared hover and pressed colour maths. Recipes emit CSS through {@link interactionColor}; contrast
 * validation uses {@link mixInteractionColor} so strengths and OKLab interpolation cannot drift.
 */

import type { Oklch } from './color.js';
import { mixOklab } from './color.js';

/** Share of the high-contrast neutral mixed into the resting colour. */
export const INTERACTION_STRENGTH = {
	hover: 0.05,
	pressed: 0.1,
} as const;

/** A transient interaction state first-party recipes can request. */
export type InteractionState = keyof typeof INTERACTION_STRENGTH;

/**
 * The same OKLab mix {@link import('./interaction-color.js').interactionColor} asks the browser to
 * paint for an opaque base.
 */
export function mixInteractionColor(base: Oklch, source: Oklch, state: InteractionState): Oklch {
	return mixOklab(base, source, INTERACTION_STRENGTH[state]);
}
