import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer } from '../styles/layered-style.css.js';
import { vars } from '../styles/vars.css.js';

export const iconButton = recipeInLayer('recipes', {
	variants: {
		size: {
			small: {
				inlineSize: vars.controlSize.small,
				paddingInline: 0,
			},
			medium: {
				inlineSize: vars.controlSize.medium,
				paddingInline: 0,
			},
		},
	},
});

export type IconButtonVariants = RecipeVariants<typeof iconButton>;
