import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';
import { spinnerOverlayBase } from '../styles/spinner-overlay.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createRecipe, createRecipeStyles } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	content: {
		alignItems: 'center',
		display: 'inline-flex',
		minInlineSize: 0,
		position: 'relative',
	},
	label: {
		alignItems: 'center',
		display: 'inline-flex',
		gap: vars.space.sp8,
		minInlineSize: 0,
	},
	labelPendingTrue: {
		opacity: 0,
	},
	// Button's only addition to the shared overlay base. It stays a separate entry because
	// StyleX cannot spread an imported compiled style into `stylex.create` ("Could not resolve
	// the path to the imported file"), so the two are composed as the recipe's base array instead.
	spinnerOverlayForcedColors: {
		'@media (forced-colors: active)': {
			color: 'ButtonText',
		},
	},
});

const resolveButtonContentStyles = createRecipeStyles({
	base: styles.content,
});

export const buttonContent = createRecipe(resolveButtonContentStyles);

const resolveButtonLabelStyles = createRecipeStyles({
	base: styles.label,
	defaultVariants: {
		isPending: false,
	},
	variants: {
		isPending: {
			false: null,
			true: styles.labelPendingTrue,
		},
	},
});

export const buttonLabel = createRecipe(resolveButtonLabelStyles);

export type ButtonLabelVariants = RecipeSelection<typeof resolveButtonLabelStyles>;

const resolveSpinnerOverlayStyles = createRecipeStyles({
	base: [spinnerOverlayBase, styles.spinnerOverlayForcedColors],
});

export const spinnerOverlay = createRecipe(resolveSpinnerOverlayStyles);
