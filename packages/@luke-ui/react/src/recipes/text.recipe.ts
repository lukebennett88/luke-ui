import { defineRecipe } from '@pandacss/dev';
import { fontSizeSteps } from '../theme/contract.js';
import {
	textAlignVariants,
	textColorVariants,
	textDecorationVariants,
	textFontVariantNumericVariants,
	textFontWeightVariants,
	textLineClampVariants,
	textSizeVariants,
	textTransformVariants,
	textWrapVariants,
} from './text.recipe-contract.js';

// These raw contract variables replicate Capsize's pseudo-element trims. They
// are not Panda tokens, and their compound CSS intentionally lands in @layer box.
const sizeStepCompoundVariants = fontSizeSteps.map((size) => ({
	shouldDisableTrim: false,
	size,
	css: {
		'&::before': {
			content: "''",
			display: 'table',
			marginBottom: `var(--luke-font-${size}-cap-height-trim)`,
		},
		'&::after': {
			content: "''",
			display: 'table',
			marginTop: `var(--luke-font-${size}-baseline-trim)`,
		},
	},
}));

export const textRecipe = defineRecipe({
	className: 'text',
	description: 'Typography scale and semantic styling for Text.',
	base: {
		color: 'text.primary',
		fontFamily: 'family',
		minInlineSize: 0,
		overflowWrap: 'break-word',
	},
	compoundVariants: sizeStepCompoundVariants,
	defaultVariants: {
		fontVariantNumeric: 'unset',
		isVisuallyHidden: false,
		lineClamp: false,
		shouldDisableTrim: false,
		shouldInheritFont: false,
		size: '300',
		textAlign: 'start',
		textDecoration: 'none',
		textTransform: 'none',
		textWrap: 'unset',
		fontWeight: 'body',
	},
	variants: {
		fontVariantNumeric: textFontVariantNumericVariants,
		isVisuallyHidden: { false: {}, true: { position: 'absolute', transform: 'scale(0)' } },
		lineClamp: textLineClampVariants,
		shouldDisableTrim: { false: {}, true: {} },
		size: textSizeVariants,
		textAlign: textAlignVariants,
		textDecoration: textDecorationVariants,
		textTransform: textTransformVariants,
		textWrap: textWrapVariants,
		fontWeight: textFontWeightVariants,
		shouldInheritFont: {
			false: {},
			true: {
				color: 'inherit',
				fontFamily: 'inherit',
				fontSize: 'inherit',
				fontStyle: 'inherit',
				fontWeight: 'inherit',
				letterSpacing: 'inherit',
				lineHeight: 'inherit',
			},
		},
		color: textColorVariants,
	},
});
