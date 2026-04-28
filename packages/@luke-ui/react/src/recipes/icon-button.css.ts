import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer, styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../styles/vars.css.js';

export const iconButtonReset = styleInLayer('utilities', {
	paddingInline: 0,
});

export const iconButton = recipeInLayer('recipes', {
	variants: {
		size: {
			small: {
				inlineSize: vars.controlSize.small,
			},
			medium: {
				inlineSize: vars.controlSize.medium,
			},
		},
	},
});

export type IconButtonVariants = RecipeVariants<typeof iconButton>;
