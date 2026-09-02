import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createSingleRecipe } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	iconPendingFalse: {},
	iconPendingTrue: { opacity: 0 },
	reset: {
		paddingInline: 0,
		'[data-pending="true"]::after': {
			blockSize: vars.iconSizeXsmall,
			borderInlineEndColor: 'transparent',
			borderColor: 'currentColor',
			borderRadius: vars.radiusFull,
			borderStyle: 'solid',
			borderWidth: '2px',
			content: "''",
			inlineSize: vars.iconSizeXsmall,
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
		inlineSize: vars.controlSizeMedium,
	},
	sizeSmall: {
		inlineSize: vars.controlSizeSmall,
	},
});

/** Reset styles that square the control and draw the pending cue on `::after`. */
export const [, resolveIconButtonResetStyles] = createSingleRecipe({
	base: styles.reset,
});

export const [iconButtonIcon] = createSingleRecipe({
	defaultVariants: { isPending: false },
	variants: {
		isPending: {
			false: styles.iconPendingFalse,
			true: styles.iconPendingTrue,
		},
	},
});

/** Recipe for the `IconButton` component's size styles. */
export const [iconButtonRecipe, resolveIconButtonRecipeStyles] = createSingleRecipe({
	variants: {
		size: {
			medium: styles.sizeMedium,
			small: styles.sizeSmall,
		},
	},
});

/** Variant type for the `IconButton` recipe. */
export type IconButtonRecipeVariants = RecipeSelection<typeof iconButtonRecipe>;
