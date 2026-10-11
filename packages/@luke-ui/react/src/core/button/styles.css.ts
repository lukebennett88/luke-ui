import { vars } from '../../theme/contract.css.js';
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
 * Lays out `startContent`/`endContent` around the label in the button appearance. The text
 * appearance has no adornments.
 */
export const buttonLabel = recipe({
	defaultVariants: {
		hasAdornments: false,
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
	},
});
