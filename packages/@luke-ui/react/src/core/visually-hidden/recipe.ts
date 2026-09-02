import * as stylex from '@stylexjs/stylex';
import { createSingleRecipe } from '../styles/stylex-recipe.js';

/**
 * WCAG-standard "visually hidden" style: keeps content in the layout and the
 * accessibility tree as a clipped 1×1px box, rather than `display: none` /
 * `visibility: hidden` (which remove it from assistive technology) or
 * `clip-path: circle(0)` (which leaves a full-size layout box and has
 * questionable Safari focus-ring support).
 *
 * Shared by the `visuallyHidden` recipe and Text's `isVisuallyHidden` variant. Unlike a Vanilla
 * Extract style object, a compiled StyleX style (the `styles.visuallyHidden` result below) is an
 * ordinary value: a recipe's `variants` map can reference it directly without spreading or
 * recompiling it, so Text's `isVisuallyHidden: true` variant imports this same compiled style
 * instead of declaring the properties a second time.
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
export const [visuallyHiddenRecipe, resolveVisuallyHiddenRecipeStyles] = createSingleRecipe({
	base: visuallyHiddenStyle,
});
