import { ICON_SIZES } from '../sizing/icon-sizing.js';
import type { RecipeSelection } from '../styles/recipe-types.js';
import { recipe } from '../styles/recipe.js';

/** Shared size dimensions for Icon and LoadingSpinner (icon-aligned sizing). */
export const iconSizeVariants = {
	large: {
		blockSize: ICON_SIZES.large,
		inlineSize: ICON_SIZES.large,
	},
	medium: {
		blockSize: ICON_SIZES.medium,
		inlineSize: ICON_SIZES.medium,
	},
	small: {
		blockSize: ICON_SIZES.small,
		inlineSize: ICON_SIZES.small,
	},
	xsmall: {
		blockSize: ICON_SIZES.xsmall,
		inlineSize: ICON_SIZES.xsmall,
	},
} as const;

export const iconRecipe = recipe({
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
export type IconRecipeVariants = RecipeSelection<typeof iconRecipe>;
