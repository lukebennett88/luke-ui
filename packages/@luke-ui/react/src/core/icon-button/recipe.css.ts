import { vars } from '../../theme/contract.css.js';
import { style } from '../styles/layered-style.css.js';
import type { RecipeSelection } from '../styles/recipe-types.js';
import { recipe } from '../styles/recipe.js';

export const iconButtonReset = style({
	paddingInline: 0,
});

export const iconButtonRecipe = recipe({
	variants: {
		size: {
			medium: {
				inlineSize: vars.controlSize.px40,
			},
			small: {
				inlineSize: vars.controlSize.px32,
			},
		},
	},
});

/** Variant type for the `IconButton` recipe. */
export type IconButtonRecipeVariants = RecipeSelection<typeof iconButtonRecipe>;
