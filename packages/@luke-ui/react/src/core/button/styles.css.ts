import { vars } from '../../theme/contract.css.js';
import type { RecipeSelection } from '../styles/recipe-types.js';
import { recipe } from '../styles/recipe.js';

/** Positioned wrapper for the button appearance, anchoring the absolute pending spinner. */
export const buttonContent = recipe({
	base: {
		alignItems: 'center',
		display: 'inline-flex',
		minInlineSize: 0,
		position: 'relative',
	},
});

/**
 * Hides the label while the pending spinner covers it. The button appearance also lays out
 * `startContent`/`endContent` around the label; the text appearance has no adornments.
 */
export const buttonLabel = recipe({
	defaultVariants: {
		hasAdornments: false,
		isPending: false,
	},
	variants: {
		hasAdornments: {
			false: {},
			true: {
				alignItems: 'center',
				display: 'inline-flex',
				gap: vars.space.sp8,
				minInlineSize: 0,
			},
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
