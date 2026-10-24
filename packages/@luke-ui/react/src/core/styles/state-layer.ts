/**
 * SPIKE #925 fallback. A translucent layer of the element's own text colour, painted as a
 * background image over whatever fill sits behind it. Its step is relative to the surface
 * underneath, so hover and pressed stay visible on `surface.overlay`, on an application-painted
 * overlay, and on every standard surface, with no surface marker.
 *
 * On a solid fill a lighter layer would cut on-solid text contrast, so a transparent button there
 * keeps today's opaque subtle chip. The solid pairing sets `solidStateFill`, which wins over the
 * layer as an opaque gradient, and `solidStateText`, the neutral text that chip pairs with.
 */
import { solidStateFill, solidStateText } from './surface.js';

type LayerState = 'hover' | 'pressed';
type LayerTone = 'neutral' | 'danger';

const STATE_LAYER_PERCENT = { hover: 8, pressed: 14 } as const satisfies Record<LayerState, number>;

/** The state layer for an element that sits on a standard surface or subtle fill. */
export function stateLayer(state: LayerState): string {
	const tint = `color-mix(in srgb, currentColor ${STATE_LAYER_PERCENT[state]}%, transparent)`;
	return `linear-gradient(${tint}, ${tint})`;
}

/** The state layer for a transparent control, which also keeps today's chip on a solid fill. */
export function transparentStateLayer(state: LayerState, tone: LayerTone) {
	const tint = `var(${solidStateFill(tone, state)}, color-mix(in srgb, currentColor ${STATE_LAYER_PERCENT[state]}%, transparent))`;
	return { backgroundImage: `linear-gradient(${tint}, ${tint})` };
}

/** The text colour a transparent control uses in a state: its resting colour, or the chip's text on a solid. */
export function transparentStateText(tone: LayerTone, restColor: string): string {
	return `var(${solidStateText(tone)}, ${restColor})`;
}
