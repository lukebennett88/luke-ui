/**
 * Adaptive hover and pressed treatment for controls whose fill must stay visible over varying
 * backgrounds. One registered `<color>` layer is painted over the control fill. The theme supplies
 * one tint pair per mode; this helper only applies CSS.
 *
 * On a solid fill the hover-to-pressed step of a translucent tint is too small, so transparent
 * controls fall back to an opaque subtle chip whose paired text stays at AA.
 */

import { createGlobalVar } from '@vanilla-extract/css';
import type { InteractionTintState } from '../../theme/interaction-tint-vars.js';
import { interactionTintVarName } from '../../theme/interaction-tint-vars.js';
import { INTERACTION_STATE_LAYER_PROPERTY } from './interaction-state-layer.js';
import type { SolidStateTone } from './surface.js';
import { solidStateFillVarName, solidStateTextVarName } from './surface.js';

/**
 * Registered, non-inheriting state-layer colour. Recipes that paint it must list
 * {@link INTERACTION_STATE_LAYER_PROPERTY} in their `transition-property` list.
 */
export const interactionStateLayer = createGlobalVar(INTERACTION_STATE_LAYER_PROPERTY, {
	inherits: false,
	initialValue: 'transparent',
	syntax: '<color>',
});

/**
 * Paints `value` as the first `background-image` layer. Forced-colours rules that clear
 * `background-image` remove it.
 */
function stateLayerValue(value: string) {
	return {
		vars: {
			[interactionStateLayer]: value,
		},
	};
}

/** Sets the registered state layer to the theme's tint for `state`. */
export function adaptiveStateLayer(state: InteractionTintState) {
	return stateLayerValue(`var(${interactionTintVarName(state)})`);
}

/**
 * Adaptive state colour for a transparent control. On a solid fill the pairing's opaque chip wins
 * so on-solid text contrast stays at AA; everywhere else the theme tint is used.
 */
export function transparentAdaptiveStateLayer(state: InteractionTintState, tone: SolidStateTone) {
	const chip = solidStateFillVarName(tone, state);
	return stateLayerValue(`var(${chip}, var(${interactionTintVarName(state)}))`);
}

/** Resting colour for a transparent control, or the chip's paired text while the chip is showing. */
export function transparentAdaptiveStateText(tone: SolidStateTone, restColor: string): string {
	return `var(${solidStateTextVarName(tone)}, ${restColor})`;
}
