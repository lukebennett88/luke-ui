import * as stylex from '@stylexjs/stylex';
import { tokens } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createSingleRecipe } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	content: {
		alignItems: 'center',
		display: 'inline-flex',
		'min-inline-size': 0,
		position: 'relative',
	},
	label: {
		alignItems: 'center',
		display: 'inline-flex',
		gap: tokens.spaceSp8,
		'min-inline-size': 0,
	},
	labelPendingFalse: {},
	labelPendingTrue: {
		opacity: 0,
	},
	spinnerOverlay: {
		alignItems: 'center',
		display: 'flex',
		inset: 0,
		justifyContent: 'center',
		position: 'absolute',
		'@media (forced-colors: active)': {
			color: 'ButtonText',
		},
	},
});

export const { recipe: buttonContent } = createSingleRecipe({
	base: styles.content,
});

export const { recipe: buttonLabel } = createSingleRecipe({
	base: styles.label,
	defaultVariants: {
		isPending: false,
	},
	variants: {
		isPending: {
			false: styles.labelPendingFalse,
			true: styles.labelPendingTrue,
		},
	},
});

export type ButtonLabelVariants = RecipeSelection<typeof buttonLabel>;

export const { recipe: spinnerOverlay } = createSingleRecipe({
	base: styles.spinnerOverlay,
});
