import { vars } from '../../theme/contract.css.js';
import type { RecipeSelection } from '../styles/recipe.js';
import { recipe } from '../styles/recipe.js';

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

/** Vanilla-extract recipe for the `Icon` component's styles. */
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
