import { ICON_SIZES } from '../sizing/icon-sizing.js';
import type { RecipeSelection } from '../styles/recipe-types.js';
import { recipe } from '../styles/recipe.js';

/** Shared size dimensions for Icon and LoadingSpinner (icon-aligned sizing). */
export const iconSizeVariants = {
	'size.32': {
		blockSize: ICON_SIZES['size.32'],
		inlineSize: ICON_SIZES['size.32'],
	},
	'size.24': {
		blockSize: ICON_SIZES['size.24'],
		inlineSize: ICON_SIZES['size.24'],
	},
	'size.20': {
		blockSize: ICON_SIZES['size.20'],
		inlineSize: ICON_SIZES['size.20'],
	},
	'size.16': {
		blockSize: ICON_SIZES['size.16'],
		inlineSize: ICON_SIZES['size.16'],
	},
} as const;

export const iconRecipe = recipe({
	base: {
		display: 'inline-flex',
		flexShrink: 0,
	},
	defaultVariants: {
		size: 'size.24',
	},
	variants: {
		size: iconSizeVariants,
	},
});

/** Variant type for the `Icon` recipe. */
export type IconRecipeVariants = RecipeSelection<typeof iconRecipe>;
