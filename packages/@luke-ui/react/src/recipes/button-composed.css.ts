import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';

export const buttonContent = recipeInLayer('recipes', {
	base: {
		alignItems: 'center',
		display: 'inline-flex',
		minInlineSize: 0,
		position: 'relative',
	},
});

export const buttonLabel = recipeInLayer('recipes', {
	base: {
		alignItems: 'center',
		display: 'inline-flex',
		gap: vars.space[200],
		minInlineSize: 0,
	},
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
});

export type ButtonLabelVariants = RecipeVariants<typeof buttonLabel>;

export const spinnerOverlay = recipeInLayer('recipes', {
	base: {
		'@media': {
			'(forced-colors: active)': {
				color: 'ButtonText',
			},
		},
		alignItems: 'center',
		color: vars.color.border.focus,
		display: 'flex',
		inset: 0,
		justifyContent: 'center',
		position: 'absolute',
	},
});
