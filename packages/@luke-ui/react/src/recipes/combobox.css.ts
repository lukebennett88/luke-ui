import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer, styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../styles/vars.css.js';
import { descendantDisabledSelector, inputChromeStyles, inputStates } from './input-states.css.js';

/**
 * The combobox control is a group wrapping an input and a trigger button, and
 * unlike a text field's group it does not receive RAC's field data attributes
 * itself — so state detection extends the defaults to also watch descendants.
 */
const comboboxStates = {
	...inputStates,
	disabled: `${inputStates.disabled}, :has(button:disabled), :has([data-disabled="true"])`,
	invalid: `${inputStates.invalid}, :has([data-invalid="true"]), :has([aria-invalid="true"])`,
};

export const comboboxRoot = styleInLayer('recipes', {
	display: 'flex',
	flexDirection: 'column',
	inlineSize: '100%',
	minInlineSize: 0,
});

export const comboboxControl = recipeInLayer('recipes', {
	// Unlike the text input's borderless disabled look, the disabled combobox
	// control keeps a visible border.
	base: inputChromeStyles(comboboxStates, { disabledBorderColor: vars.border.default }),
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: {
			medium: {
				fontSize: vars.font.size.standard,
				minBlockSize: vars.controlSize.medium,
			},
			small: {
				fontSize: vars.font.size.small,
				minBlockSize: vars.controlSize.small,
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
				backgroundColor: 'transparent',
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

export const comboboxClearButton = recipeInLayer('recipes', {
	base: {
		alignItems: 'center',
		appearance: 'none',
		backgroundColor: 'transparent',
		border: 'none',
		color: vars.foregroundColor.secondary,
		cursor: 'pointer',
		display: 'inline-flex',
		flexShrink: 0,
		justifyContent: 'center',

		selectors: {
			'&:where([data-hovered="true"], :hover)': {
				color: vars.foregroundColor.primary,
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
				paddingInline: vars.space.xsmall,
			},
			small: {
				blockSize: vars.controlSize.small,
				paddingInline: vars.space.xxsmall,
			},
		},
	},
});

export const comboboxItemCheck = styleInLayer('recipes', {
	flexShrink: 0,
	marginInlineStart: 'auto',
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
			medium: {
				minBlockSize: vars.controlSize.medium,
				paddingBlock: vars.space.xsmall,
				paddingInline: vars.space.small,
			},
			small: {
				minBlockSize: vars.controlSize.small,
				paddingBlock: vars.space.xxsmall,
				paddingInline: vars.space.xsmall,
			},
		},
	},
});

export const comboboxSection = recipeInLayer('recipes', {
	base: {
		display: 'flex',
		flexDirection: 'column',
		gap: vars.space.xxsmall,
		paddingBlock: vars.space.xsmall,

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
		'@media': {
			'(forced-colors: active)': {
				selectors: {
					// Forced colors strips background highlights, so the active option
					// gets a ring there — it's the only possible indicator.
					'&[data-focus-visible="true"]': {
						outlineColor: 'Highlight',
						outlineOffset: '-2px',
						outlineStyle: 'solid',
						outlineWidth: '2px',
					},
				},
			},
		},

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
			// DOM focus stays on the input (aria-activedescendant), which shows the
			// only focus ring; the keyboard-active option is indicated by a
			// background one step stronger than hover, not a second ring. Declared
			// after the focused/selected backgrounds so it wins on the same option.
			'&[data-focus-visible="true"]:not([data-disabled="true"])': {
				backgroundColor: vars.backgroundColor.pressed,
			},
		},
	},
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: {
			medium: {
				fontSize: vars.font.size.small,
				paddingBlock: vars.space.small,
				paddingInline: vars.space.small,
			},
			small: {
				fontSize: vars.font.size.small,
				paddingBlock: vars.space.xsmall,
				paddingInline: vars.space.small,
			},
		},
	},
});

export type ComboboxVariants = RecipeVariants<typeof comboboxControl>;
