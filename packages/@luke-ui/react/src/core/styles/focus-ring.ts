import { createGlobalVar, fallbackVar } from '@vanilla-extract/css';
import { vars } from '../../theme/contract.css.js';

/**
 * The focus ring colour a fill sets for rings inside it. `surfaceStyle` sets a role solid's
 * on-solid colour, which the compiler gates at 4.5:1 against every solid state, and resets it on
 * every other surface, so rings there read `color.focus`.
 */
export const focusContext = createGlobalVar('luke-internal-focus');

/**
 * The focus ring: a 2px solid outline at a 2px offset, in the colour of the fill around the element
 * that draws it.
 *
 * The ring sits outside the element, so the element takes its parent's ring colour, even when it
 * paints a fill of its own. `!important` lets that reset win over the element's fill in any layer
 * and state, including the global `:focus-visible` rule in the reset layer.
 */
export function focusRing() {
	return {
		outlineColor: fallbackVar(focusContext, vars.color.focus),
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		vars: { [focusContext]: 'inherit !important' },
	} as const;
}
