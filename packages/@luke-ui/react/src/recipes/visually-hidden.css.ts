import type { StyleRule } from '@vanilla-extract/css';
import { recipe } from './recipe.js';

/**
 * WCAG-standard "visually hidden" style: keeps content in the layout and the
 * accessibility tree as a clipped 1×1px box, rather than `display: none` /
 * `visibility: hidden` (which remove it from assistive technology) or
 * `clip-path: circle(0)` (which leaves a full-size layout box and has
 * questionable Safari focus-ring support).
 *
 * Shared by the `visuallyHidden` recipe and Text's `isVisuallyHidden` variant.
 */
export const visuallyHiddenStyle = {
	blockSize: '1px', // 1px, not 0: zero dimensions trip screen-reader bugs
	clip: 'rect(1px, 1px, 1px, 1px)', // legacy fallback for clip-path
	clipPath: 'inset(100%)',
	inlineSize: '1px',
	overflow: 'hidden',
	position: 'absolute',
	whiteSpace: 'nowrap', // stop text wrapping inside the 1px box
} satisfies StyleRule;

/** Recipe for content hidden visually but kept available to assistive technology. */
export const visuallyHidden = recipe({
	base: visuallyHiddenStyle,
});
