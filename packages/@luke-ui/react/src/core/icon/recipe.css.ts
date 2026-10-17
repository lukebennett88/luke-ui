import { ICON_SIZES } from '../sizing/icon-sizing.js';
import type { RecipeSelection } from '../styles/recipe-types.js';
import { recipe } from '../styles/recipe.js';

/** Shared size dimensions for Icon and LoadingSpinner (icon-aligned sizing). */
export const iconSizeVariants = {
	px32: {
		blockSize: ICON_SIZES.px32,
		inlineSize: ICON_SIZES.px32,
	},
	px24: {
		blockSize: ICON_SIZES.px24,
		inlineSize: ICON_SIZES.px24,
	},
	px20: {
		blockSize: ICON_SIZES.px20,
		inlineSize: ICON_SIZES.px20,
	},
	px16: {
		blockSize: ICON_SIZES.px16,
		inlineSize: ICON_SIZES.px16,
	},
} as const;

export const iconRecipe = recipe({
	base: {
		display: 'inline-flex',
		flexShrink: 0,
	},
	defaultVariants: {
		size: 'px24',
	},
	variants: {
		size: iconSizeVariants,
	},
});

/** Variant type for the `Icon` recipe. */
export type IconRecipeVariants = RecipeSelection<typeof iconRecipe>;
