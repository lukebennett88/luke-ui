import { contextualFocus } from './surface.js';

/**
 * The keyboard focus ring. It always reads the container's focus context, so inside a painted solid
 * it paints that role's on-solid colour and elsewhere the literal focus colour.
 */
export function focusRing() {
	return {
		outlineColor: contextualFocus(),
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	} as const;
}
