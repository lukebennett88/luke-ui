import { vars } from '../../theme/contract.css.js';
import { styleInLayer } from '../styles/layered-style.css.js';
import type { RecipeSelection } from '../styles/recipe.js';
import { recipe } from '../styles/recipe.js';

const base = styleInLayer('recipes', {
	borderInlineStart: `3px solid ${vars.color.border.decorative}`,
	paddingInlineStart: vars.space.sp16,
});

/** Vanilla-extract recipe for the `Blockquote` component's left-border accent. */
export const blockquoteRecipe = recipe({
	base,
});

export type BlockquoteRecipeVariants = RecipeSelection<typeof blockquoteRecipe>;
