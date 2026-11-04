/** Adaptive hover and pressed treatment for controls whose fill must stay visible over varying
 * backgrounds. One registered `<color>` layer is painted over the control fill. The theme supplies
 * one tint pair per mode; this helper only applies CSS.
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
