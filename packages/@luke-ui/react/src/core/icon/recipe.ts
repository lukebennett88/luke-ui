import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createRecipe, createRecipeStyles } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	base: {
		display: 'inline-flex',
		flexShrink: 0,
	},
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

/**
 * Shared size styles for Icon and LoadingSpinner. A compiled StyleX style is an ordinary value, so
 * LoadingSpinner's `size` variants reference these instead of declaring the dimensions twice.
 */
export const iconSizeStyles = {
	large: styles.sizeLarge,
	medium: styles.sizeMedium,
	small: styles.sizeSmall,
	xsmall: styles.sizeXsmall,
} as const;

/** Canonical resolver for the `Icon` component's styles. */
export const resolveIconRecipeStyles = createRecipeStyles({
	base: styles.base,
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: iconSizeStyles,
	},
});

/** Recipe for the `Icon` component's styles. */
export const iconRecipe = createRecipe(resolveIconRecipeStyles);

/** Variant type for the `Icon` recipe. */
export type IconRecipeVariants = RecipeSelection<typeof resolveIconRecipeStyles>;
