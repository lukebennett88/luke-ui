import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/recipe-authoring.js';
import { recipe } from '../styles/recipe-authoring.js';

/**
 * Size styles shared by Icon and LoadingSpinner.
 *
 * Declared with `stylex.create` rather than inline in the recipe below because LoadingSpinner's
 * `size` variants reference these compiled styles directly, so the dimensions are authored and
 * extracted once rather than declared twice.
 */
const styles = stylex.create({
	sizeLarge: {
		blockSize: vars.iconSize.large,
		inlineSize: vars.iconSize.large,
	},
	sizeMedium: {
		blockSize: vars.iconSize.medium,
		inlineSize: vars.iconSize.medium,
	},
	sizeSmall: {
		blockSize: vars.iconSize.small,
		inlineSize: vars.iconSize.small,
	},
	sizeXsmall: {
		blockSize: vars.iconSize.xsmall,
		inlineSize: vars.iconSize.xsmall,
	},
});

/** Shared size styles for Icon and LoadingSpinner. */
export const iconSizeStyles = {
	large: styles.sizeLarge,
	medium: styles.sizeMedium,
	small: styles.sizeSmall,
	xsmall: styles.sizeXsmall,
} as const;

/** Recipe for the `Icon` component's styles. */
export const iconRecipe = recipe({
	base: {
		display: 'inline-flex',
		flexShrink: 0,
	},
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: {
			large: iconSizeStyles.large,
			medium: iconSizeStyles.medium,
			small: iconSizeStyles.small,
			xsmall: iconSizeStyles.xsmall,
		},
	},
});

/** Variant type for the `Icon` recipe. */
export type IconRecipeVariants = RecipeSelection<typeof iconRecipe>;
