import { recipe } from './recipe.js';

/**
 * Recipe for content hidden visually but kept available to assistive technology.
 *
 * Uses the WCAG-standard clip technique: the element stays in the layout and the
 * accessibility tree as a clipped 1×1px box. This is preferred over
 * `display: none` / `visibility: hidden` (which remove it from assistive
 * technology) and over `clip-path: circle(0)` (which leaves a full-size layout box
 * and has questionable Safari focus-ring support).
 */
export const visuallyHidden = recipe({
	base: {
		blockSize: '1px', // 1px, not 0: zero dimensions trip screen-reader bugs
		clip: 'rect(1px, 1px, 1px, 1px)', // legacy fallback for clip-path
		clipPath: 'inset(100%)',
		inlineSize: '1px',
		overflow: 'hidden',
		position: 'absolute',
		whiteSpace: 'nowrap', // stop text wrapping inside the 1px box
	},
});
