import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer, styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../styles/vars.css.js';

const transitionProperty = 'color, background-color, border-color';

const disabledState =
	'[data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(button:disabled), :has([data-disabled="true"])';
const descendantDisabledState = '[data-disabled="true"], [aria-disabled="true"]';
const focusWithinState = '[data-focus-within="true"], [data-focused="true"], :focus-within';
const hoverState = '[data-hovered="true"], :hover';
const invalidState =
	'[data-invalid="true"], [aria-invalid="true"], :has(:invalid), :has(input[aria-invalid="true"]), :has([data-invalid="true"]), :has([aria-invalid="true"])';
const readOnlyState = '[data-readonly="true"], :has(:read-only)';

const controlDisabledSelector = `&:where(${disabledState})`;
const controlFocusWithinSelector = `&:where(${focusWithinState})`;
const controlHoverSelector = `&:where(${hoverState}):not(:where(${disabledState})):not(:where(${focusWithinState}))`;
const controlInvalidSelector = `&:where(${invalidState})`;
const controlInvalidFocusWithinSelector = `&:where(${invalidState}):where(${focusWithinState})`;
const controlReadOnlySelector = `&:where(${readOnlyState})`;
const descendantDisabledSelector = `:where(${descendantDisabledState}) &`;

export const comboboxRoot = styleInLayer('recipes', {
	display: 'flex',
	flexDirection: 'column',
	inlineSize: '100%',
	minInlineSize: 0,
});

export const comboboxControl = recipeInLayer('recipes', {
	base: {
		alignItems: 'center',
		backgroundColor: vars.backgroundColor.input,
		borderColor: vars.border.input,
		borderRadius: vars.borderRadius.medium,
		borderStyle: 'solid',
		borderWidth: vars.borderWidth.thin,
		color: vars.themeColor.inputColor,
		display: 'inline-flex',
		fontFamily: vars.font.family.body,
		inlineSize: '100%',
		minInlineSize: 0,
		overflow: 'hidden',
		transitionDuration: vars.motion.duration.fast,
		transitionProperty,
		transitionTimingFunction: vars.motion.easing.standard,

		selectors: {
			[controlDisabledSelector]: {
				backgroundColor: vars.backgroundColor.inputDisabled,
				borderColor: vars.border.default,
				color: vars.foregroundColor.disabled,
				cursor: 'not-allowed',
			},
			[controlHoverSelector]: {
				borderColor: vars.themeColor.paletteThemePrimary400,
			},
			[controlFocusWithinSelector]: {
				borderColor: vars.themeColor.paletteThemePrimary500,
				outlineColor: vars.themeColor.paletteThemePrimary200,
				outlineOffset: 0,
				outlineStyle: 'solid',
				outlineWidth: '3px',
			},
			[controlInvalidSelector]: {
				borderColor: vars.border.critical,
				outlineStyle: 'none',
			},
			[controlInvalidFocusWithinSelector]: {
				borderColor: vars.border.critical,
				outlineColor: vars.themeColor.paletteThemePrimary200,
				outlineOffset: 0,
				outlineStyle: 'solid',
				outlineWidth: '3px',
			},
			[controlReadOnlySelector]: {
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
				minBlockSize: vars.controlSize.small,
			},
			medium: {
				fontSize: vars.font.size.standard,
				minBlockSize: vars.controlSize.medium,
			},
		},
	},
});

export const comboboxTextInput = recipeInLayer('recipes', {
	base: {
		appearance: 'none',
		backgroundColor: 'transparent',
		border: 'none',
		color: vars.themeColor.inputColor,
		flex: 1,
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: 'inherit',
		inlineSize: '100%',
		lineHeight: vars.font.lineHeight.tight,
		minInlineSize: 0,
		outline: 'none',
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

export const comboboxTrigger = recipeInLayer('recipes', {
	base: {
		alignItems: 'center',
		appearance: 'none',
		backgroundColor: vars.backgroundColor.input,
		border: 'none',
		color: vars.foregroundColor.secondary,
		cursor: 'pointer',
		display: 'inline-flex',
		flexShrink: 0,
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: 'inherit',
		gap: vars.space.xsmall,
		inlineSize: '100%',
		justifyContent: 'space-between',
		lineHeight: vars.font.lineHeight.tight,
		minInlineSize: 0,
		outline: 'none',
		position: 'relative',

		selectors: {
			'&:not(:first-child)': {
				backgroundColor: vars.backgroundColor.subtle,
				inlineSize: 'auto',
			},
			'&:not(:first-child)::before': {
				backgroundColor: vars.border.input,
				blockSize: '24px',
				content: '',
				inlineSize: vars.borderWidth.thin,
				insetBlockStart: '50%',
				insetInlineStart: 0,
				position: 'absolute',
				transform: 'translateY(-50%)',
			},
			'&:where(:first-child)': {
				backgroundColor: 'transparent',
				color: vars.foregroundColor.primary,
			},
			'&:where([data-disabled="true"], :disabled)': {
				color: vars.foregroundColor.disabled,
				cursor: 'not-allowed',
			},
			[descendantDisabledSelector]: {
				backgroundColor: 'transparent',
				color: vars.border.input,
			},
			'&:not(:first-child):where([data-disabled="true"], :disabled)': {
				backgroundColor: 'transparent',
				color: vars.border.input,
			},
			'&:not(:first-child):where([data-disabled="true"], :disabled)::before': {
				backgroundColor: vars.border.default,
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

export const comboboxPopover = recipeInLayer('recipes', {
	base: {
		backgroundColor: vars.backgroundColor.default,
		borderRadius: vars.borderRadius.large,
		boxShadow: vars.boxShadow.medium,
		inlineSize: 'var(--trigger-width)',
		minInlineSize: 'var(--trigger-width)',
		overflow: 'hidden',
	},
});

export const comboboxListBox = recipeInLayer('recipes', {
	base: {
		boxSizing: 'border-box',
		inlineSize: '100%',
		listStyle: 'none',
		margin: 0,
		maxBlockSize: '18.75rem',
		outline: 'none',
		overflow: 'auto',
		padding: vars.space.xsmall,
	},
});

export const comboboxLoadMoreItem = recipeInLayer('recipes', {
	base: {
		alignItems: 'center',
		color: vars.foregroundColor.secondary,
		display: 'flex',
		inlineSize: '100%',
		justifyContent: 'center',
		minInlineSize: 0,
	},
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: {
			small: {
				minBlockSize: vars.controlSize.small,
				paddingBlock: vars.space.xxsmall,
				paddingInline: vars.space.xsmall,
			},
			medium: {
				minBlockSize: vars.controlSize.medium,
				paddingBlock: vars.space.xsmall,
				paddingInline: vars.space.small,
			},
		},
	},
});

export const comboboxSection = recipeInLayer('recipes', {
	base: {
		paddingBlock: vars.space.xsmall,
		display: 'flex',
		flexDirection: 'column',
		gap: vars.space.xxsmall,

		selectors: {
			'& + &': {
				borderBlockStartColor: vars.border.default,
				borderBlockStartStyle: 'solid',
				borderBlockStartWidth: vars.borderWidth.thin,
			},
		},
	},
});

export const comboboxSectionHeading = styleInLayer('recipes', {
	color: vars.foregroundColor.secondary,
	fontSize: vars.font.size.small,
	fontWeight: vars.font.weight.medium,
	lineHeight: vars.font.lineHeight.tight,
	paddingBlockEnd: vars.space.xxsmall,
	paddingBlockStart: 0,
	paddingInline: vars.space.small,
});

export const comboboxEmptyState = recipeInLayer('recipes', {
	base: {
		alignItems: 'center',
		color: vars.foregroundColor.secondary,
		display: 'flex',
		fontSize: vars.font.size.small,
		justifyContent: 'center',
		lineHeight: vars.font.lineHeight.tight,
		paddingBlock: vars.space.large,
		paddingInline: vars.space.small,
		textAlign: 'center',
	},
});

export const comboboxItem = recipeInLayer('recipes', {
	base: {
		alignItems: 'center',
		borderRadius: vars.borderRadius.medium,
		color: vars.foregroundColor.primary,
		cursor: 'default',
		display: 'flex',
		gap: vars.space.xsmall,
		inlineSize: '100%',
		lineHeight: vars.font.lineHeight.tight,
		minInlineSize: 0,
		outline: 'none',

		selectors: {
			'&[data-disabled="true"]': {
				color: vars.foregroundColor.disabled,
				cursor: 'not-allowed',
			},
			'&[data-focused="true"]:not([data-disabled="true"])': {
				backgroundColor: vars.backgroundColor.hover,
			},
			'&[data-selected="true"]:not([data-disabled="true"])': {
				backgroundColor: vars.backgroundColor.subtle,
				fontWeight: vars.font.weight.medium,
			},
			'&[data-focus-visible="true"]': {
				outlineColor: vars.themeColor.paletteThemePrimary200,
				outlineOffset: 0,
				outlineStyle: 'solid',
				outlineWidth: '3px',
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
				paddingBlock: vars.space.xsmall,
				paddingInline: vars.space.small,
			},
			medium: {
				fontSize: vars.font.size.small,
				paddingBlock: vars.space.small,
				paddingInline: vars.space.small,
			},
		},
	},
});

export type ComboboxVariants = RecipeVariants<typeof comboboxControl>;
