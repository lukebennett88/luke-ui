import { vars } from '../../theme/contract.css.js';
import { recipe } from '../styles/recipe.js';
import type { RecipeSelection } from '../styles/recipe-types.js';

/** Left-border accent. Type treatment comes from the composed `Text`. */
export const blockquoteRecipe = recipe({
	base: {
		borderInlineStart: `3px solid ${vars.color.border.decorative}`,
		paddingInlineStart: vars.space.sp16,
	},
});

export type BlockquoteRecipeVariants = RecipeSelection<typeof blockquoteRecipe>;
