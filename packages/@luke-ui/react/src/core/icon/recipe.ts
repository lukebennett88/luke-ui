import * as stylex from '@stylexjs/stylex';
import { tokens } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createSingleRecipe } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	base: {
		display: 'inline-flex',
		flexShrink: 0,
	},
	sizeLarge: {
		'block-size': tokens.iconSizeLarge,
		'inline-size': tokens.iconSizeLarge,
	},
	sizeMedium: {
		'block-size': tokens.iconSizeMedium,
		'inline-size': tokens.iconSizeMedium,
	},
	sizeSmall: {
		'block-size': tokens.iconSizeSmall,
		'inline-size': tokens.iconSizeSmall,
	},
	sizeXsmall: {
		'block-size': tokens.iconSizeXsmall,
		'inline-size': tokens.iconSizeXsmall,
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
export const { recipe: iconRecipe, resolveStyles: resolveIconRecipeStyles } = createSingleRecipe({
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
