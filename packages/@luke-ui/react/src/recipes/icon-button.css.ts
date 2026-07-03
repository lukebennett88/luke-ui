import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer, styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../styles/vars.css.js';

export const iconButtonReset = styleInLayer('utilities', {
	paddingInline: 0,
});

/** Vanilla-extract recipe for the `IconButton` primitive's styles. */
export const iconButton = recipeInLayer('recipes', {
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
export type IconButtonVariants = RecipeVariants<typeof iconButton>;
