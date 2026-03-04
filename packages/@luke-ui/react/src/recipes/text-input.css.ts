import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer } from '../styles/layered-style.css.js';
import { vars } from '../styles/vars.css.js';

const transitionProperty = 'color, background-color, border-color';

const disabledState =
	'[data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])';
/** Only explicit disabled attrs; avoids :has() matching an ancestor that contains any disabled input on the page. */
const descendantDisabledState = '[data-disabled="true"], [aria-disabled="true"]';
const focusWithinState = '[data-focus-within="true"], :focus-within';
const hoverState = '[data-hovered="true"], :hover';
const invalidState =
	'[data-invalid="true"], [aria-invalid="true"], :has(:invalid), :has(input[aria-invalid="true"])';
const readOnlyState = '[data-readonly="true"], :has(:read-only)';

const groupDisabledSelector = `&:where(${disabledState})`;
const groupHoverSelector = `&:where(${hoverState}):not(:where(${disabledState})):not(:where(${focusWithinState}))`;
const groupFocusWithinSelector = `&:where(${focusWithinState})`;
const groupInvalidSelector = `&:where(${invalidState})`;
const groupInvalidFocusWithinSelector = `&:where(${invalidState}):where(${focusWithinState})`;
const groupReadOnlySelector = `&:where(${readOnlyState})`;
const descendantDisabledSelector = `:where(${descendantDisabledState}) &`;

export const textInputGroup = recipeInLayer('recipes', {
	base: {
		alignItems: 'center',
		backgroundColor: vars.backgroundColor.input,
		borderColor: vars.border.input,
		borderRadius: vars.borderRadius.medium,
		borderStyle: 'solid',
		borderWidth: vars.borderWidth.thin,
		color: vars.themeColor.inputColor,
		cursor: 'text',
		display: 'inline-flex',
		fontFamily: vars.font.family.body,
		inlineSize: '100%',
		minInlineSize: 0,
		overflow: 'hidden',
		transitionDuration: vars.motion.duration.fast,
		transitionProperty,
		transitionTimingFunction: vars.motion.easing.standard,

		selectors: {
			[groupDisabledSelector]: {
				backgroundColor: vars.backgroundColor.inputDisabled,
				borderColor: vars.backgroundColor.inputDisabled,
				color: vars.foregroundColor.disabled,
				cursor: 'not-allowed',
			},
			[groupHoverSelector]: {
				borderColor: vars.themeColor.paletteThemePrimary400,
			},
			[groupFocusWithinSelector]: {
				borderColor: vars.themeColor.paletteThemePrimary500,
				outlineColor: vars.themeColor.paletteThemePrimary200,
				outlineOffset: 0,
				outlineStyle: 'solid',
				outlineWidth: '3px',
			},
			[groupInvalidSelector]: {
				borderColor: vars.border.critical,
				outlineStyle: 'none',
			},
			[groupInvalidFocusWithinSelector]: {
				borderColor: vars.border.critical,
				outlineColor: vars.themeColor.paletteThemePrimary200,
				outlineOffset: 0,
				outlineStyle: 'solid',
				outlineWidth: '3px',
			},
			[groupReadOnlySelector]: {
				backgroundColor: vars.backgroundColor.subtle,
			},
		},
	},
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: {
			small: {
				fontSize: vars.font.size.small,
				blockSize: vars.controlSize.small,
			},
			medium: {
				fontSize: vars.font.size.standard,
				blockSize: vars.controlSize.medium,
			},
		},
	},
});

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
			small: {
				blockSize: vars.controlSize.small,
				paddingInlineEnd: vars.space.xsmall,
				paddingInlineStart: vars.space.xsmall,
			},
			medium: {
				blockSize: vars.controlSize.medium,
				paddingInlineEnd: vars.space.small,
				paddingInlineStart: vars.space.small,
			},
		},
	},
});

export const textInputAdornmentStart = recipeInLayer('recipes', {
	base: {
		alignItems: 'center',
		color: vars.foregroundColor.secondary,
		display: 'inline-flex',
		flexShrink: 0,
		lineHeight: vars.font.lineHeight.nospace,
		borderInlineEndColor: vars.border.input,
		borderInlineEndStyle: 'solid',
		borderInlineEndWidth: vars.borderWidth.thin,

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
			small: {
				paddingInlineEnd: vars.space.xsmall,
				paddingInlineStart: vars.space.xsmall,
			},
			medium: {
				paddingInlineEnd: vars.space.small,
				paddingInlineStart: vars.space.small,
			},
		},
	},
});

export const textInputAdornmentEnd = recipeInLayer('recipes', {
	base: {
		alignItems: 'center',
		backgroundColor: vars.backgroundColor.subtle,
		color: vars.foregroundColor.secondary,
		display: 'inline-flex',
		flexShrink: 0,
		lineHeight: vars.font.lineHeight.nospace,
		borderInlineStartColor: vars.border.input,
		borderInlineStartStyle: 'solid',
		borderInlineStartWidth: vars.borderWidth.thin,

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
			small: {
				paddingInlineEnd: vars.space.xsmall,
				paddingInlineStart: vars.space.xsmall,
			},
			medium: {
				paddingInlineEnd: vars.space.small,
				paddingInlineStart: vars.space.small,
			},
		},
	},
});

export type TextInputVariants = RecipeVariants<typeof textInputGroup>;
