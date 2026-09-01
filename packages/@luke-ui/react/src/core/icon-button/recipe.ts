import * as stylex from '@stylexjs/stylex';
import { tokens } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createSingleRecipe } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	iconPendingFalse: {},
	iconPendingTrue: { opacity: 0 },
	reset: {
		'padding-inline': 0,
		'[data-pending="true"]::after': {
			'block-size': tokens.iconSizeXsmall,
			'border-inline-end-color': 'transparent',
			borderColor: 'currentColor',
			borderRadius: tokens.radiusFull,
			borderStyle: 'solid',
			borderWidth: '2px',
			content: "''",
			'inline-size': tokens.iconSizeXsmall,
			position: 'absolute',
		},
		'@media (forced-colors: active)': {
			'[data-pending="true"]::after': {
				'border-inline-end-color': 'transparent',
				borderColor: 'ButtonText',
			},
		},
	},
	sizeMedium: {
		'inline-size': tokens.controlSizeMedium,
	},
	sizeSmall: {
		'inline-size': tokens.controlSizeSmall,
	},
});

/** Reset styles that square the control and draw the pending cue on `::after`. */
export const { resolveStyles: resolveIconButtonResetStyles } = createSingleRecipe({
	base: styles.reset,
});

export const { recipe: iconButtonIcon } = createSingleRecipe({
	defaultVariants: { isPending: false },
	variants: {
		isPending: {
			false: styles.iconPendingFalse,
			true: styles.iconPendingTrue,
		},
	},
});

/** Recipe for the `IconButton` component's size styles. */
export const { recipe: iconButtonRecipe, resolveStyles: resolveIconButtonRecipeStyles } =
	createSingleRecipe({
		variants: {
			size: {
				medium: styles.sizeMedium,
				small: styles.sizeSmall,
			},
		},
	});

/** Variant type for the `IconButton` recipe. */
export type IconButtonRecipeVariants = RecipeSelection<typeof iconButtonRecipe>;
