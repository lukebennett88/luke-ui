import { recipe } from './recipe.js';

/**
 * Recipe for content hidden visually but kept available to assistive technology.
 */
export const visuallyHidden = recipe({
	base: {
		position: 'absolute' /* take out of document flow */,
		clipPath: 'circle(0)' /* reduce clickable area to nothing */,
	},
});
