/** Adaptive hover and pressed treatment for controls whose fill must stay visible over varying
 * backgrounds. One registered `<color>` layer is painted over the control fill. The theme supplies
 * one tint pair per mode; this helper only applies CSS.
 *
 * On a solid fill the hover-to-pressed step of a translucent tint is too small, so transparent
 * controls fall back to an opaque subtle chip whose paired text stays at AA.
 */

import * as interactionTints from '../../theme/interaction-tint-vars.js';
import { interactionStateLayer } from './state-layer.css.js';

function stateLayerValue(value: string) {
	return {
		vars: {
			[interactionStateLayer]: value,
		},
	};
}

/** Sets the registered state layer to the theme's tint for `state`. */
export function adaptiveStateLayer(state: interactionTints.InteractionTintState) {
	return stateLayerValue(`var(${interactionTints.interactionTintVarName(state)})`);
}

/**
 * Adaptive state colour for a transparent control. On a solid fill the pairing's opaque chip wins
 * so on-solid text contrast stays at AA; everywhere else the theme tint is used.
 */
export function transparentAdaptiveStateLayer(
	state: interactionTints.InteractionTintState,
	tone: interactionTints.SolidStateTone,
) {
	const chip = interactionTints.solidStateFillVarName(tone, state);
	return stateLayerValue(`var(${chip}, var(${interactionTints.interactionTintVarName(state)}))`);
}

/** Resting colour for a transparent control, or the chip's paired text while the chip is showing. */
export function transparentAdaptiveStateText(
	tone: interactionTints.SolidStateTone,
	restColor: string,
): string {
	return `var(${interactionTints.solidStateTextVarName(tone)}, ${restColor})`;
}
