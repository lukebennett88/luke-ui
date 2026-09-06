import { vars } from '../../theme/contract.css.js';
import type { RecipeSelection } from '../styles/recipe.js';
import { recipe } from '../styles/recipe.js';

/** Vanilla-extract recipe for the `Blockquote` component's left-border accent. */
export const blockquoteRecipe = recipe({
	base: {
		borderInlineStart: `3px solid ${vars.color.border.decorative}`,
		paddingInlineStart: vars.space.sp16,
	},
});

export type BlockquoteRecipeVariants = RecipeSelection<typeof blockquoteRecipe>;
