import { recipeInLayer, styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../styles/vars.css.js';

export const buttonContent = styleInLayer('recipes', {
	alignItems: 'center',
	display: 'inline-flex',
	minInlineSize: 0,
	position: 'relative',
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

export const spinnerOverlay = styleInLayer('recipes', {
	alignItems: 'center',
	display: 'flex',
	inset: 0,
	justifyContent: 'center',
	position: 'absolute',
});
