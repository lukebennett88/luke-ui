import { vars } from '../../theme/contract.css.js';
import {
	CONTROL_BORDER_HOVER_STRENGTH,
	CONTROL_BORDER_PRESSED_STRENGTH,
} from '../../theme/contrast-policy.js';

/** A control border mixed toward readable text for hover or pressed feedback. */
export function controlBorderState(state: 'hover' | 'pressed'): string {
	const strength =
		state === 'hover' ? CONTROL_BORDER_HOVER_STRENGTH : CONTROL_BORDER_PRESSED_STRENGTH;
	return `color-mix(in srgb, ${vars.color.border.control} ${100 - strength * 100}%, ${vars.color.text.primary} ${strength * 100}%)`;
}
