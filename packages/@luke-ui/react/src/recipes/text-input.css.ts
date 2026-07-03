import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer } from '../styles/layered-style.css.js';
import { vars } from '../styles/vars.css.js';
import { descendantDisabledSelector, inputChromeStyles, inputStates } from './input-states.css.js';

/** Vanilla-extract recipe for the `TextInput` group styles. */
export const textInputGroup = recipeInLayer('recipes', {
	base: {
		...inputChromeStyles(inputStates),
		cursor: 'text',
	},
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: {
			medium: {
				blockSize: vars.controlSize.medium,
				fontSize: vars.font.size.standard,
			},
			small: {
				blockSize: vars.controlSize.small,
				fontSize: vars.font.size.small,
			},
		},
	},
});

/** Vanilla-extract recipe for the `TextInput` control styles. */
export const textInputControl = recipeInLayer('recipes', {
	base: {
		appearance: 'none',
		backgroundColor: 'transparent',
		borderColor: 'transparent',
		borderStyle: 'none',
		borderWidth: 0,
		color: vars.themeColor.inputColor,
		cursor: 'text',
		flex: 1,
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: 'inherit',
		inlineSize: '100%',
		lineHeight: vars.font.lineHeight.tight,
		minInlineSize: 0,
		outlineColor: 'transparent',
		outlineStyle: 'none',
		outlineWidth: 0,
		paddingBlockEnd: 0,
		paddingBlockStart: 0,

		selectors: {
			'&::placeholder': {
				color: vars.foregroundColor.secondary,
				opacity: 1,
			},
			'&:where([data-disabled="true"], :disabled)': {
				color: vars.foregroundColor.disabled,
				cursor: 'not-allowed',
			},
		},
	},
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: {
			medium: {
				blockSize: vars.controlSize.medium,
				paddingInlineEnd: vars.space.small,
				paddingInlineStart: vars.space.small,
			},
			small: {
				blockSize: vars.controlSize.small,
				paddingInlineEnd: vars.space.xsmall,
				paddingInlineStart: vars.space.xsmall,
			},
		},
	},
});

/** Vanilla-extract recipe for the `TextInput` start-adornment styles. */
export const textInputAdornmentStart = recipeInLayer('recipes', {
	base: {
		alignItems: 'center',
		borderInlineEndColor: vars.border.input,
		borderInlineEndStyle: 'solid',
		borderInlineEndWidth: vars.borderWidth.thin,
		color: vars.foregroundColor.secondary,
		display: 'inline-flex',
		flexShrink: 0,
		lineHeight: vars.font.lineHeight.nospace,

		selectors: {
			[descendantDisabledSelector]: {
				backgroundColor: vars.backgroundColor.inputDisabled,
				color: vars.foregroundColor.disabled,
			},
		},
	},
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: {
			medium: {
				paddingInlineEnd: vars.space.small,
				paddingInlineStart: vars.space.small,
			},
			small: {
				paddingInlineEnd: vars.space.xsmall,
				paddingInlineStart: vars.space.xsmall,
			},
		},
	},
});

/** Vanilla-extract recipe for the `TextInput` end-adornment styles. */
export const textInputAdornmentEnd = recipeInLayer('recipes', {
	base: {
		alignItems: 'center',
		backgroundColor: vars.backgroundColor.subtle,
		borderInlineStartColor: vars.border.input,
		borderInlineStartStyle: 'solid',
		borderInlineStartWidth: vars.borderWidth.thin,
		color: vars.foregroundColor.secondary,
		display: 'inline-flex',
		flexShrink: 0,
		lineHeight: vars.font.lineHeight.nospace,

		selectors: {
			[descendantDisabledSelector]: {
				backgroundColor: vars.backgroundColor.inputDisabled,
				color: vars.foregroundColor.disabled,
			},
		},
	},
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: {
			medium: {
				paddingInlineEnd: vars.space.small,
				paddingInlineStart: vars.space.small,
			},
			small: {
				paddingInlineEnd: vars.space.xsmall,
				paddingInlineStart: vars.space.xsmall,
			},
		},
	},
});

/** Variant type for the `TextInput` recipe. */
export type TextInputVariants = RecipeVariants<typeof textInputGroup>;
