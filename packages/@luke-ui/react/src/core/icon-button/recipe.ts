import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createRecipe, createRecipeStyles } from '../styles/stylex-recipe.js';

export const styles = stylex.create({
	iconPending: { opacity: 0 },
	reset: {
		paddingInline: 0,
		'[data-pending="true"]::after': {
			blockSize: vars.iconSize.xsmall,
			borderInlineEndColor: 'transparent',
			borderColor: 'currentColor',
			borderRadius: vars.radius.full,
			borderStyle: 'solid',
			borderWidth: '2px',
			content: "''",
			inlineSize: vars.iconSize.xsmall,
			position: 'absolute',
		},
		'@media (forced-colors: active)': {
			'[data-pending="true"]::after': {
				borderInlineEndColor: 'transparent',
				borderColor: 'ButtonText',
			},
		},
	},
	sizeMedium: {
		inlineSize: vars.controlSize.medium,
	},
	sizeSmall: {
		inlineSize: vars.controlSize.small,
	},
});

/**
 * Maps the `size` variant onto its compiled style, authored once and reused for both the public
 * `iconButtonRecipe` variants and `IconButton`'s internal `xstyle` composition, so the mapping is
 * never duplicated.
 */
export const sizeStyles = {
	medium: styles.sizeMedium,
	small: styles.sizeSmall,
} as const;

/** Canonical resolver for the `IconButton` component's size styles. */
const resolveIconButtonRecipeStyles = createRecipeStyles({
	variants: {
		size: sizeStyles,
	},
});

/** Recipe for the `IconButton` component's size styles. */
export const iconButtonRecipe = createRecipe(resolveIconButtonRecipeStyles);

/** Variant type for the `IconButton` recipe. */
export type IconButtonRecipeVariants = RecipeSelection<typeof resolveIconButtonRecipeStyles>;
