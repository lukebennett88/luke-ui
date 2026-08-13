import type { RecipeSelection } from '../styles/recipe.js';
import { recipe } from '../styles/recipe.js';
import { spinnerOverlayBase } from '../styles/spinner-overlay.js';
import { vars } from '../theme/contract.css.js';

export const buttonContent = recipe({
	base: {
		alignItems: 'center',
		display: 'inline-flex',
		minInlineSize: 0,
		position: 'relative',
	},
});

export const buttonLabel = recipe({
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

export type ButtonLabelVariants = RecipeSelection<typeof buttonLabel>;

export const spinnerOverlay = recipe({
	base: {
		'@media': {
			'(forced-colors: active)': {
				color: 'ButtonText',
			},
		},
		...spinnerOverlayBase,
	},
});
