import { vars } from '../../theme/contract.css.js';
import { style } from '../styles/layered-style.css.js';
import { recipe } from '../styles/recipe.js';
import type { RecipeSelection } from '../styles/recipe-types.js';

export const iconButtonReset = style({
	paddingInline: 0,
});

export const iconButtonIcon = recipe({
	defaultVariants: { isPending: false },
	variants: {
		isPending: {
			false: {},
			true: { opacity: 0 },
		},
	},
});

export const iconButtonRecipe = recipe({
	variants: {
		size: {
			medium: {
				inlineSize: vars.controlSize.medium,
			},
			small: {
				inlineSize: vars.controlSize.small,
			},
		},
	},
});

/** Variant type for the `IconButton` recipe. */
export type IconButtonRecipeVariants = RecipeSelection<typeof iconButtonRecipe>;
