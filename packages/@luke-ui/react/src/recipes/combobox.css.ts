import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer, styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../styles/vars.css.js';
import { dimensionToRemString } from '../tokens/converters.js';
import { breakpointValues } from '../tokens/values.js';
import { descendantDisabledSelector, inputChromeStyles, inputStates } from './input-states.css.js';

/** Custom property mirroring `visualViewport.height`, set by `useVisualViewportVars`. */
export const comboboxTrayViewportHeightVar = '--luke-ui-visual-viewport-height';

/** Custom property mirroring the on-screen keyboard's height, set by `useVisualViewportVars`. */
export const comboboxTrayKeyboardInsetVar = '--luke-ui-keyboard-inset';

// Below this width the popover renders as a bottom tray instead of a positioned popover, matching
// Adobe Spectrum's combobox pattern (https://react-aria.adobe.com/blog/building-a-combobox).
const trayMediaQuery = `(width < ${dimensionToRemString(breakpointValues.small)})`;

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
		display: 'flex',
		flexDirection: 'column',
		inlineSize: 'var(--trigger-width)',
		minInlineSize: 'var(--trigger-width)',
		overflow: 'hidden',
		// A subtle fade for the desktop popover; the tray media query below swaps this for a
		// slide. RAC keeps the element mounted during data-entering/data-exiting so the
		// transition has time to run.
		transition: [
			`opacity ${vars.motion.duration.fast} ${vars.motion.easing.standard}`,
			`translate ${vars.motion.duration.fast} ${vars.motion.easing.standard}`,
			`box-shadow ${vars.motion.duration.fast} ${vars.motion.easing.standard}`,
		].join(', '),

		selectors: {
			'&[data-entering]': {
				opacity: 0,
			},
			'&[data-exiting]': {
				opacity: 0,
			},
		},

		'@media': {
			[trayMediaQuery]: {
				borderBlockStart: `${vars.borderWidth.thin} solid ${vars.border.default}`,
				borderEndEndRadius: 0,
				borderEndStartRadius: 0,
				borderStartEndRadius: vars.borderRadius.xlarge,
				borderStartStartRadius: vars.borderRadius.xlarge,
				boxShadow: `${vars.boxShadow.large}, 0 0 0 100vmax rgba(0, 0, 0, 0.2)`,
				// RAC's `menuWidth`-driven inline `width` style, and the base recipe's own
				// `var(--trigger-width)`, both need to lose to the full-width tray.
				inlineSize: 'auto !important' as 'auto',
				// RAC positions the popover with inline styles (`position`, `top`, `left`,
				// `max-height`); cascade layers can't out-rank inline styles, only `!important`
				// can — and these logical properties still beat RAC's physical ones.
				insetBlockEnd: `var(${comboboxTrayKeyboardInsetVar}, 0px) !important`,
				insetBlockStart: 'auto !important' as 'auto',
				insetInline: '0 !important',
				maxBlockSize: `calc(var(${comboboxTrayViewportHeightVar}, 100dvh) - ${vars.space.xxlarge}) !important`,
				minInlineSize: 'auto !important' as 'auto',
				// iPhone home indicator safe area.
				paddingBlockEnd: 'env(safe-area-inset-bottom, 0px)',
				position: 'fixed !important' as 'fixed',

				selectors: {
					'&::before': {
						alignSelf: 'center',
						backgroundColor: vars.border.default,
						blockSize: '4px',
						borderRadius: vars.borderRadius.full,
						content: '',
						flexShrink: 0,
						inlineSize: '36px',
						marginBlockEnd: vars.space.xxsmall,
						marginBlockStart: vars.space.xsmall,
					},
					'&[data-entering]': {
						boxShadow: `${vars.boxShadow.large}, 0 0 0 100vmax transparent`,
						opacity: 1,
						translate: '0 100%',
					},
					'&[data-exiting]': {
						boxShadow: `${vars.boxShadow.large}, 0 0 0 100vmax transparent`,
						opacity: 1,
						translate: '0 100%',
					},
				},
			},
			// The global reduced-motion reset lives in the `reset` layer, so it can't beat this
			// recipe's transition. Declared after the tray query so it also disables the slide,
			// not just the desktop fade — exit is instant instead of animating.
			'(prefers-reduced-motion: reduce)': {
				transition: 'none',
			},
		},

		// Prevents the popover/tray being squeezed unusably small when React Aria's inline
		// `max-height` gets tiny in cramped viewports, without adding empty space for short
		// lists: at least 12em when content is taller, exactly content height when shorter.
		// `min-block-size` beats even an inline `max-height` per CSS min/max resolution, so no
		// `!important` needed. `calc-size()` is Chromium-only, hence the `@supports` gate — other
		// browsers keep today's fixed-height behavior. https://jakearchibald.com/2026/goldilocks-select-height/
		'@supports': {
			'(min-block-size: calc-size(fit-content, size))': {
				minBlockSize: 'calc-size(fit-content, min(size, 12em))',
			},
		},
	},
});

export const comboboxListBox = recipeInLayer('recipes', {
	base: {
		boxSizing: 'border-box',
		flex: 1,
		inlineSize: '100%',
		listStyle: 'none',
		margin: 0,
		maxBlockSize: '18.75rem',
		minBlockSize: 0,
		outline: 'none',
		overflow: 'auto',
		padding: vars.space.xsmall,

		'@media': {
			[trayMediaQuery]: {
				maxBlockSize: 'none',
			},
		},
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
