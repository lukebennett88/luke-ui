import { vars } from '../../theme/contract.css.js';
import type { RecipeSelection } from '../styles/recipe.js';
import { recipe } from '../styles/recipe.js';

export const buttonContent = recipe({
	variants: {
		appearance: {
			button: {
				alignItems: 'center',
				display: 'inline-flex',
				minInlineSize: 0,
				position: 'relative',
			},
			text: {
				position: 'relative',
			},
		},
	},
});

export const buttonLabel = recipe({
	defaultVariants: {
		appearance: 'button',
		isPending: false,
	},
	variants: {
		appearance: {
			button: {
				alignItems: 'center',
				display: 'inline-flex',
				gap: vars.space.sp8,
				minInlineSize: 0,
			},
			text: {},
		},
		isPending: {
			false: {},
			true: {
				opacity: 0,
			},
		},
	},
});

export type ButtonLabelVariants = RecipeSelection<typeof buttonLabel>;
