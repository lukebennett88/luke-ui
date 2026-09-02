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
		'block-size': vars.iconSizeLarge,
		'inline-size': vars.iconSizeLarge,
	},
	sizeMedium: {
		'block-size': vars.iconSizeMedium,
		'inline-size': vars.iconSizeMedium,
	},
	sizeSmall: {
		'block-size': vars.iconSizeSmall,
		'inline-size': vars.iconSizeSmall,
	},
	sizeXsmall: {
		'block-size': vars.iconSizeXsmall,
		'inline-size': vars.iconSizeXsmall,
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
