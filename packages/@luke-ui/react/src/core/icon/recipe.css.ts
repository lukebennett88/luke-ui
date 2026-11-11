import { contextualIconSize, ICON_SIZES } from '../sizing/icon-sizing.js';
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

/** Square box an icon or spinner takes when it has no explicit `size`. */
export const contextualIconBox = {
	blockSize: contextualIconSize,
	inlineSize: contextualIconSize,
} as const;

/**
 * Sizes an icon box. Without `size`, it takes the size its container sets, such as `xsmall` inside a
 * Button, or `medium` outside any container. Apply it to a custom `<svg>` to size it like `Icon`.
 */
export const iconRecipe = recipe({
	base: {
		...contextualIconBox,
		display: 'inline-flex',
		flexShrink: 0,
	},
	variants: {
		size: iconSizeVariants,
	},
});

/** Variant type for the `Icon` recipe. */
export type IconRecipeVariants = RecipeSelection<typeof iconRecipe>;
