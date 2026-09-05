import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/recipe-authoring.js';
import { compiledStyle, recipe } from '../styles/recipe-authoring.js';
import { spinnerOverlayBase } from '../styles/spinner-overlay.js';

export const buttonContent = recipe({
	base: {
		alignItems: 'center',
		display: 'inline-flex',
		minInlineSize: 0,
		position: 'relative',
	},
});

export const buttonLabel = recipe({
	base: {
		alignItems: 'center',
		display: 'inline-flex',
		gap: vars.space.sp8,
		minInlineSize: 0,
	},
	defaultVariants: {
		isPending: false,
	},
	variants: {
		isPending: {
			false: null,
			true: { opacity: 0 },
		},
	},
});

export type ButtonLabelVariants = RecipeSelection<typeof buttonLabel>;

// Button's only addition to the shared overlay base. It stays a separate array entry because
// StyleX cannot spread an imported compiled style into `stylex.create` ("Could not resolve the
// path to the imported file"), so the two are composed as the recipe's base array instead.
export const spinnerOverlay = recipe({
	base: [
		compiledStyle(spinnerOverlayBase),
		{ '@media (forced-colors: active)': { color: 'ButtonText' } },
	],
});
