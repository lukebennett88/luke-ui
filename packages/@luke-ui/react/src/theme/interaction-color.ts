/**
 * Derives hover and pressed colours from a resting semantic colour. Strengths and OKLab
 * interpolation live in `interaction-mix.ts` so recipes and contrast validation cannot drift.
 */

import { vars } from './contract.css.js';
import type { InteractionState } from './interaction-mix.js';
import { INTERACTION_STRENGTH } from './interaction-mix.js';

export { INTERACTION_STRENGTH, mixInteractionColor } from './interaction-mix.js';
export type { InteractionState } from './interaction-mix.js';

/**
 * The mode-resolved high-contrast neutral. This is an implementation input, not a public
 * interaction token.
 */
const INTERACTION_SOURCE = vars.color.text.primary;

function strengthPercent(state: InteractionState): number {
	return INTERACTION_STRENGTH[state] * 100;
}

/**
 * A CSS colour for a hover or pressed state, suitable for `backgroundColor`, `color`, or
 * `borderColor`.
 *
 * Opaque bases mix in OKLab with the high-contrast neutral. A transparent base becomes a
 * translucent interaction colour of that same source and strength.
 */
export function interactionColor(base: string, state: InteractionState): string {
	const percent = strengthPercent(state);
	if (base === 'transparent') {
		return `color-mix(in oklab, ${INTERACTION_SOURCE} ${percent}%, transparent)`;
	}
	return `color-mix(in oklab, ${base} ${100 - percent}%, ${INTERACTION_SOURCE} ${percent}%)`;
}
