import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';

/** Shared size dimensions for Icon and LoadingSpinner (icon-aligned sizing). */
export const iconSizeVariants = {
	large: {
		blockSize: vars.iconSize.large,
		inlineSize: vars.iconSize.large,
	},
	medium: {
		blockSize: vars.iconSize.medium,
		inlineSize: vars.iconSize.medium,
	},
	small: {
		blockSize: vars.iconSize.small,
		inlineSize: vars.iconSize.small,
	},
	xsmall: {
		blockSize: vars.iconSize.xsmall,
		inlineSize: vars.iconSize.xsmall,
	},
} as const;

/** Vanilla-extract recipe for the `Icon` primitive's styles. */
export const icon = recipeInLayer('recipes', {
	base: {
		display: 'inline-flex',
		flexShrink: 0,
	},
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: iconSizeVariants,
	},
});

/** Variant type for the `Icon` recipe. */
export type IconVariants = RecipeVariants<typeof icon>;
