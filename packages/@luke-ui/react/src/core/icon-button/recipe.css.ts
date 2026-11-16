import { vars } from '../../theme/contract.css.js';
import { style } from '../styles/layered-style.css.js';
import type { RecipeSelection } from '../styles/recipe-types.js';
import { recipe } from '../styles/recipe.js';

export const iconButtonSizes = {
	medium: vars.controlSize['40'],
	small: vars.controlSize['32'],
};

export const iconButtonReset = style({
	paddingInline: 0,
});

export const iconButtonRecipe = recipe({
	variants: {
		size: {
			medium: {
				inlineSize: iconButtonSizes.medium,
			},
			small: {
				inlineSize: iconButtonSizes.small,
			},
		},
	},
});

/** Variant type for the `IconButton` recipe. */
export type IconButtonRecipeVariants = RecipeSelection<typeof iconButtonRecipe>;
