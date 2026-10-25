/**
 * Adaptive hover and pressed treatment for controls whose fill must stay visible over varying
 * backgrounds (#925). One registered `<color>` property is painted as the first `background-image`
 * layer. Theme mode rules supply a single black (light) or white (dark) tint pair; this helper only
 * applies CSS.
 *
 * On a solid fill, a translucent tint can cut on-solid text below AA. Transparent controls then
 * fall back to an opaque subtle chip the solid pairing sets; see {@link solidStateFill}.
 */

import { createGlobalVar } from '@vanilla-extract/css';
import type { InteractionTintState } from '../../theme/interaction-tint-vars.js';
import { interactionTintVarName } from '../../theme/interaction-tint-vars.js';
import { solidStateFill, solidStateText } from './surface.js';

/**
 * Registered, non-inheriting state-layer colour. Recipes that paint it must list
 * {@link INTERACTION_STATE_LAYER_PROPERTY} in their `transition-property` list.
 */
export const interactionStateLayer = createGlobalVar('luke-interaction-state-layer', {
	inherits: false,
	initialValue: 'transparent',
	syntax: '<color>',
});

/** The custom property name of {@link interactionStateLayer}, for `transition-property`. */
export const INTERACTION_STATE_LAYER_PROPERTY = '--luke-interaction-state-layer';

type SolidStateTone = 'neutral' | 'danger';

/**
 * Sets the registered state layer to the theme's tint for `state` and paints it as the first
 * `background-image` layer. Forced-colours rules that clear `background-image` remove it.
 */
export function adaptiveStateLayer(state: InteractionTintState) {
	return {
		backgroundImage: `linear-gradient(${interactionStateLayer}, ${interactionStateLayer})`,
		vars: {
			[interactionStateLayer]: `var(${interactionTintVarName(state)})`,
		},
	};
}

/**
 * Adaptive layer for a transparent control. On a solid fill the pairing's opaque chip wins so
 * on-solid text contrast stays at AA; everywhere else the theme tint is used.
 */
export function transparentAdaptiveStateLayer(state: InteractionTintState, tone: SolidStateTone) {
	return {
		backgroundImage: `linear-gradient(${interactionStateLayer}, ${interactionStateLayer})`,
		vars: {
			[interactionStateLayer]: `var(${solidStateFill(tone, state)}, var(${interactionTintVarName(state)}))`,
		},
	};
}

/** Resting colour for a transparent control, or the chip's paired text while the chip is showing. */
export function transparentAdaptiveStateText(tone: SolidStateTone, restColor: string): string {
	return `var(${solidStateText(tone)}, ${restColor})`;
}
