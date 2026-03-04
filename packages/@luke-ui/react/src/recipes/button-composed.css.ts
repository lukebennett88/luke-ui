import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer } from '../styles/layered-style.css.js';
import { vars } from '../styles/vars.css.js';

export const buttonContent = recipeInLayer('recipes', {
	base: {
		alignItems: 'center',
		display: 'inline-flex',
		minInlineSize: 0,
		position: 'relative',
	},
});

export const buttonLabel = recipeInLayer('recipes', {
	defaultVariants: {
		isPending: false,
	},
	variants: {
		isPending: {
			false: {},
			true: {
				opacity: 0,
			},
		},
	},
	base: {
		alignItems: 'center',
		display: 'inline-flex',
		gap: vars.space.xsmall,
		minInlineSize: 0,
	},
});

export type ButtonLabelVariants = RecipeVariants<typeof buttonLabel>;

export const spinnerOverlay = recipeInLayer('recipes', {
	base: {
		alignItems: 'center',
		display: 'flex',
		inset: 0,
		justifyContent: 'center',
		position: 'absolute',
	},
});
