import * as stylex from '@stylexjs/stylex';
import { recipe } from '../styles/recipe-authoring.js';

/**
 * WCAG-standard "visually hidden" style: keeps content in the layout and the
 * accessibility tree as a clipped 1×1px box, rather than `display: none` /
 * `visibility: hidden` (which remove it from assistive technology) or
 * `clip-path: circle(0)` (which leaves a full-size layout box and has
 * questionable Safari focus-ring support).
 *
 * Declared with `stylex.create` rather than inline in the recipe below because Text's
 * `isVisuallyHidden` variant references the compiled style directly, so these declarations are
 * authored and extracted once rather than repeated in a second recipe.
 */
const styles = stylex.create({
	visuallyHidden: {
		blockSize: '1px', // 1px, not 0: zero dimensions trip screen-reader bugs
		clip: 'rect(1px, 1px, 1px, 1px)', // legacy fallback for clip-path
		clipPath: 'inset(100%)',
		inlineSize: '1px',
		overflow: 'hidden',
		position: 'absolute',
		whiteSpace: 'nowrap', // stop text wrapping inside the 1px box
	},
});

/** StyleX style for content hidden visually but kept available to assistive technology. */
export const visuallyHiddenStyle = styles.visuallyHidden;

/** Recipe for content hidden visually but kept available to assistive technology. */
export const visuallyHiddenRecipe = recipe({
	base: visuallyHiddenStyle,
});
