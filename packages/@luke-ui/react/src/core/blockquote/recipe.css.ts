import { vars } from '../../theme/contract.css.js';
import { recipe } from '../styles/recipe.js';

/** Left-border accent. Type treatment comes from the composed `Text`. */
export const blockquoteRecipe = recipe({
	base: {
		borderInlineStart: `3px solid ${vars.color.border.decorative}`,
		paddingInlineStart: vars.space.sp16,
	},
});
