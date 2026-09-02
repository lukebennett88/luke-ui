import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createSingleRecipe } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	base: {
		display: 'inline-flex',
		flexShrink: 0,
	},
	sizeLarge: {
		blockSize: vars.iconSizeLarge,
		inlineSize: vars.iconSizeLarge,
	},
	sizeMedium: {
		blockSize: vars.iconSizeMedium,
		inlineSize: vars.iconSizeMedium,
	},
	sizeSmall: {
		blockSize: vars.iconSizeSmall,
		inlineSize: vars.iconSizeSmall,
	},
	sizeXsmall: {
		blockSize: vars.iconSizeXsmall,
		inlineSize: vars.iconSizeXsmall,
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

/** Recipe for the `Icon` component's styles. */
export const [iconRecipe, resolveIconRecipeStyles] = createSingleRecipe({
	base: styles.base,
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: iconSizeStyles,
	},
});

/** Variant type for the `Icon` recipe. */
export type IconRecipeVariants = RecipeSelection<typeof iconRecipe>;
