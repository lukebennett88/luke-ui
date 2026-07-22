import type { StyleRule } from '@vanilla-extract/css';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import { focusRing } from '../styles/focus-ring.js';
import { recipeInLayer, styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';
import {
	composeInputStateSelectors,
	descendantDisabledSelector,
	inputStates,
} from './input-states.css.js';

/** Custom property mirroring `visualViewport.height`, set by `useVisualViewportVars`. */
export const comboboxTrayViewportHeightVar = '--luke-ui-visual-viewport-height';

/** Custom property mirroring the on-screen keyboard's height, set by `useVisualViewportVars`. */
export const comboboxTrayKeyboardInsetVar = '--luke-ui-keyboard-inset';

// Below 640px the popover renders as a bottom tray, matching Adobe Spectrum's combobox pattern.
const trayMediaQuery = '(width < 40rem)';

const comboboxStates = {
	...inputStates,
	disabled: `${inputStates.disabled}, :has(button:disabled), :has([data-disabled="true"])`,
	invalid: `${inputStates.invalid}, :has([data-invalid="true"]), :has([aria-invalid="true"])`,
};
const { disabled, focusWithin, hover, invalid, invalidFocusWithin, readOnly, readOnlyFocusWithin } =
	composeInputStateSelectors(comboboxStates);

export const comboboxRoot = styleInLayer('recipes', {
	display: 'flex',
	flexDirection: 'column',
	inlineSize: '100%',
	minInlineSize: 0,
});

export const comboboxControl = recipeInLayer('recipes', {
	base: {
		'@media': {
			'(forced-colors: active)': {
				backgroundColor: 'Field',
				borderColor: 'FieldText',
				boxShadow: 'none',
				color: 'FieldText',
				forcedColorAdjust: 'auto',
				selectors: {
					[disabled]: { borderColor: 'GrayText', color: 'GrayText', opacity: 1 },
					[focusWithin]: { outlineColor: 'Highlight' },
					[invalidFocusWithin]: { outlineColor: 'Highlight' },
				},
			},
			'(prefers-reduced-motion: reduce)': { transition: 'none' },
		},
		alignItems: 'center',
		backgroundColor: vars.color.surface.recessed,
		borderColor: vars.color.border.control,
		borderRadius: vars.radius.control,
		borderStyle: 'solid',
		borderWidth: '1px',
		boxShadow: vars.depth.recessed,
		color: vars.color.text.primary,
		cursor: 'text',
		display: 'inline-flex',
		fontFamily: vars.font.family,
		inlineSize: '100%',
		isolation: 'isolate',
		letterSpacing: vars.font[300].letterSpacing,
		lineHeight: vars.font[300].lineHeight,
		minInlineSize: 0,
		outlineColor: 'transparent',
		outlineOffset: 0,
		outlineStyle: 'solid',
		outlineWidth: '2px',
		overflow: 'visible',
		transitionDuration: vars.motion.duration.fast,
		transitionProperty: 'background-color, border-color, color',
		transitionTimingFunction: vars.motion.easing.standard,

		selectors: {
			[disabled]: { cursor: 'not-allowed', opacity: 0.55 },
			[focusWithin]: {
				borderColor: vars.color.intent.accent.border,
				...focusRing(vars.color.border.focus),
			},
			[hover]: { borderColor: vars.color.intent.accent.border },
			[invalid]: { borderColor: vars.color.intent.danger.border },
			[invalidFocusWithin]: {
				borderColor: vars.color.intent.danger.border,
				...focusRing(vars.color.border.focus),
			},
			[readOnly]: {
				backgroundColor: vars.color.surface.canvas,
				borderColor: vars.color.border.decorative,
				boxShadow: 'none',
			},
			[readOnlyFocusWithin]: { ...focusRing(vars.color.border.focus) },
		},
	},
	defaultVariants: { size: 'medium' },
	variants: {
		size: {
			medium: { blockSize: vars.controlSize.medium, fontSize: vars.font[300].fontSize },
			small: {
				blockSize: vars.controlSize.small,
				...vars.font[200],
			},
		},
	},
});

export const comboboxTextInput = recipeInLayer('recipes', {
	base: {
		appearance: 'none',
		backgroundColor: 'transparent',
		border: 'none',
		color: vars.color.text.primary,
		cursor: 'text',
		flex: 1,
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: 'inherit',
		inlineSize: '100%',
		letterSpacing: 'inherit',
		lineHeight: 'inherit',
		minInlineSize: 0,
		outline: 'none',
		paddingBlock: 0,

		selectors: {
			'&::placeholder': { color: vars.color.text.secondary, opacity: 1 },
			'&:where([data-disabled="true"], :disabled)': {
				color: vars.color.textDisabled,
				cursor: 'not-allowed',
			},
		},
	},
	defaultVariants: { size: 'medium' },
	variants: {
		size: {
			medium: {
				blockSize: vars.controlSize.medium,
				paddingInlineEnd: vars.space[300],
				paddingInlineStart: vars.space[300],
			},
			small: {
				blockSize: vars.controlSize.small,
				paddingInlineEnd: vars.space[200],
				paddingInlineStart: vars.space[200],
			},
		},
	},
});

const comboboxActionStyles = {
	'@media': {
		'(forced-colors: active)': {
			backgroundColor: 'ButtonFace',
			boxShadow: 'none',
			color: 'ButtonText',
			forcedColorAdjust: 'auto',
			selectors: {
				'&[data-disabled="true"]': { color: 'GrayText', opacity: 1 },
				'&[data-focus-visible="true"]': { outlineColor: 'Highlight' },
				'&[data-hovered="true"]:not([data-disabled="true"]):not([aria-disabled="true"])': {
					backgroundColor: 'Highlight',
					boxShadow: 'none',
					color: 'HighlightText',
					outlineColor: 'Highlight',
					transform: 'none',
				},
				'&[data-pressed="true"]:not([data-disabled="true"]):not([aria-disabled="true"])': {
					backgroundColor: 'Highlight',
					boxShadow: 'none',
					color: 'HighlightText',
					outlineColor: 'Highlight',
					transform: 'none',
				},
			},
		},
		'(prefers-reduced-motion: reduce)': { transform: 'none', transition: 'none' },
	},
	alignItems: 'center',
	appearance: 'none',
	backgroundColor: 'transparent',
	border: 'none',
	borderRadius: vars.radius.detail,
	boxShadow: 'none',
	color: vars.color.text.secondary,
	cursor: 'pointer',
	display: 'inline-flex',
	flexShrink: 0,
	fontFamily: 'inherit',
	fontSize: 'inherit',
	fontWeight: 'inherit',
	justifyContent: 'center',
	minBlockSize: '24px',
	minInlineSize: '24px',
	outlineColor: 'transparent',
	outlineOffset: '2px',
	outlineStyle: 'solid',
	outlineWidth: '2px',
	transform: 'none',
	transitionDuration: vars.motion.duration.fast,
	transitionProperty: 'background-color, color',
	transitionTimingFunction: vars.motion.easing.standard,

	selectors: {
		'&[data-disabled="true"]': { cursor: 'not-allowed' },
		'&[data-focus-visible="true"]': { ...focusRing(vars.color.border.focus) },
		'&[data-hovered="true"]:not([data-disabled="true"])': {
			backgroundColor: vars.color.intent.accent.surface.subtleHover,
			color: vars.color.text.primary,
		},
		'&[data-pressed="true"]:not([data-disabled="true"])': {
			backgroundColor: vars.color.intent.accent.surface.subtlePressed,
			color: vars.color.text.primary,
		},
		[descendantDisabledSelector]: { color: vars.color.textDisabled },
	},
} satisfies StyleRule;

export const comboboxTrigger = recipeInLayer('recipes', {
	base: {
		...comboboxActionStyles,
		marginInlineEnd: vars.space[100],
		marginInlineStart: vars.space[100],

		selectors: {
			...comboboxActionStyles.selectors,
			'&:first-child': {
				color: vars.color.text.primary,
				inlineSize: '100%',
				justifyContent: 'space-between',
				marginInline: 0,
			},
		},
	},
	defaultVariants: { size: 'medium' },
	variants: {
		size: {
			medium: {
				blockSize: '28px',
				inlineSize: '28px',
				paddingInline: 0,
			},
			small: {
				blockSize: '24px',
				inlineSize: '24px',
				paddingInline: 0,
			},
		},
	},
});

export const comboboxClearButton = recipeInLayer('recipes', {
	base: comboboxActionStyles,
	defaultVariants: { size: 'medium' },
	variants: {
		size: {
			medium: { blockSize: '28px', inlineSize: '28px', paddingInline: 0 },
			small: { blockSize: '24px', inlineSize: '24px', paddingInline: 0 },
		},
	},
});

export const comboboxItemCheck = styleInLayer('recipes', {
	flexShrink: 0,
	marginInlineStart: 'auto',
});

export const comboboxPopover = recipeInLayer('recipes', {
	base: {
		'@media': {
			'(forced-colors: active)': {
				backgroundColor: 'Canvas',
				borderColor: 'CanvasText',
				boxShadow: 'none',
				forcedColorAdjust: 'auto',
			},
			[trayMediaQuery]: {
				borderEndEndRadius: 0,
				borderEndStartRadius: 0,
				borderStartEndRadius: vars.radius.overlay,
				borderStartStartRadius: vars.radius.overlay,
				boxShadow: `${vars.depth.floating}, 0 0 0 100vmax rgb(0 0 0 / 20%)`,
				inlineSize: 'auto !important' as 'auto',
				insetBlockEnd: `var(${comboboxTrayKeyboardInsetVar}, 0px) !important`,
				insetBlockStart: 'auto !important' as 'auto',
				insetInline: '0 !important',
				maxBlockSize: `calc(var(${comboboxTrayViewportHeightVar}, 100dvh) - ${vars.space[800]}) !important`,
				minInlineSize: 'auto !important' as 'auto',
				paddingBlockEnd: 'env(safe-area-inset-bottom, 0px)',
				position: 'fixed !important' as 'fixed',
				selectors: {
					'&::before': {
						alignSelf: 'center',
						backgroundColor: vars.color.border.decorative,
						blockSize: '4px',
						borderRadius: vars.radius.full,
						content: '',
						flexShrink: 0,
						inlineSize: '36px',
						marginBlockEnd: vars.space[100],
						marginBlockStart: vars.space[200],
					},
					'&[data-entering]': {
						boxShadow: `${vars.depth.floating}, 0 0 0 100vmax transparent`,
						opacity: 1,
						translate: '0 100%',
					},
					'&[data-exiting]': {
						boxShadow: `${vars.depth.floating}, 0 0 0 100vmax transparent`,
						opacity: 1,
						translate: '0 100%',
					},
				},
			},
			'(prefers-reduced-motion: reduce)': {
				transition: 'none',
				selectors: {
					'&[data-entering]': { opacity: 1, translate: 'none' },
					'&[data-exiting]': { opacity: 1, translate: 'none' },
				},
			},
		},
		backgroundColor: vars.color.surface.floating,
		borderColor: vars.color.border.decorative,
		borderRadius: vars.radius.surface,
		borderStyle: 'solid',
		borderWidth: '1px',
		boxShadow: vars.depth.floating,
		display: 'flex',
		flexDirection: 'column',
		inlineSize: 'var(--trigger-width)',
		isolation: 'isolate',
		minInlineSize: 'var(--trigger-width)',
		overflow: 'hidden',
		transition: [
			`opacity ${vars.motion.duration.fast} ${vars.motion.easing.standard}`,
			`translate ${vars.motion.duration.fast} ${vars.motion.easing.standard}`,
			`box-shadow ${vars.motion.duration.fast} ${vars.motion.easing.standard}`,
		].join(', '),

		selectors: {
			'&[data-entering]': { opacity: 0 },
			'&[data-exiting]': { opacity: 0 },
		},

		'@supports': {
			'(min-block-size: calc-size(fit-content, size))': {
				minBlockSize: 'calc-size(fit-content, min(size, 12em))',
			},
		},
	},
});

export const comboboxListBox = recipeInLayer('recipes', {
	base: {
		'@media': { [trayMediaQuery]: { maxBlockSize: 'none' } },
		boxSizing: 'border-box',
		flex: 1,
		inlineSize: '100%',
		listStyle: 'none',
		margin: 0,
		maxBlockSize: '18.75rem',
		minBlockSize: 0,
		outline: 'none',
		overflow: 'auto',
		padding: vars.space[100],
	},
});

export const comboboxLoadMoreItem = recipeInLayer('recipes', {
	base: {
		alignItems: 'center',
		color: vars.color.text.secondary,
		display: 'flex',
		inlineSize: '100%',
		justifyContent: 'center',
		minInlineSize: 0,
	},
	defaultVariants: { size: 'medium' },
	variants: {
		size: {
			medium: {
				minBlockSize: vars.controlSize.medium,
				paddingBlock: vars.space[200],
				paddingInline: vars.space[300],
			},
			small: {
				minBlockSize: vars.controlSize.small,
				paddingBlock: vars.space[100],
				paddingInline: vars.space[200],
			},
		},
	},
});

export const comboboxSection = recipeInLayer('recipes', {
	base: {
		display: 'flex',
		flexDirection: 'column',
		gap: vars.space[100],
		paddingBlock: vars.space[200],

		selectors: {
			'& + &': { borderBlockStart: `1px solid ${vars.color.border.decorative}` },
		},
	},
});

export const comboboxSectionHeading = styleInLayer('recipes', {
	color: vars.color.text.secondary,
	...vars.font[200],
	fontWeight: vars.font.weight.label,
	paddingBlockEnd: vars.space[100],
	paddingBlockStart: 0,
	paddingInline: vars.space[300],
});

export const comboboxEmptyState = recipeInLayer('recipes', {
	base: {
		alignItems: 'center',
		color: vars.color.text.secondary,
		display: 'flex',
		...vars.font[200],
		justifyContent: 'center',
		paddingBlock: vars.space[600],
		paddingInline: vars.space[300],
		textAlign: 'center',
	},
});

export const comboboxItem = recipeInLayer('recipes', {
	base: {
		'@media': {
			'(forced-colors: active)': {
				forcedColorAdjust: 'auto',
				selectors: {
					'&[data-disabled="true"]': { color: 'GrayText', opacity: 1 },
					'&[data-focus-visible="true"]': {
						outlineColor: 'Highlight',
						outlineOffset: '-2px',
						outlineStyle: 'solid',
						outlineWidth: '2px',
					},
					'&[data-selected="true"]:not([data-disabled="true"])': {
						backgroundColor: 'Highlight',
						color: 'HighlightText',
					},
				},
			},
			'(prefers-reduced-motion: reduce)': { transform: 'none', transition: 'none' },
		},
		alignItems: 'center',
		backgroundColor: 'transparent',
		borderRadius: vars.radius.control,
		color: vars.color.text.primary,
		cursor: 'default',
		display: 'flex',
		gap: vars.space[200],
		inlineSize: '100%',
		minBlockSize: '24px',
		minInlineSize: 0,
		outline: 'none',
		transform: 'none',
		transitionDuration: vars.motion.duration.fast,
		transitionProperty: 'background-color, color, opacity',
		transitionTimingFunction: vars.motion.easing.standard,

		selectors: {
			'&[data-disabled="true"]': {
				color: vars.color.textDisabled,
				cursor: 'not-allowed',
				opacity: 0.55,
			},
			'&[data-focused="true"]:not([data-disabled="true"])': {
				backgroundColor: vars.color.intent.neutral.surface.subtle,
			},
			'&[data-hovered="true"]:not([data-disabled="true"])': {
				backgroundColor: vars.color.intent.neutral.surface.subtleHover,
			},
			'&[data-focus-visible="true"]:not([data-disabled="true"])': {
				backgroundColor: vars.color.intent.accent.surface.subtleHover,
			},
			'&[data-selected="true"]:not([data-disabled="true"])': {
				backgroundColor: vars.color.intent.accent.surface.subtle,
				fontWeight: vars.font.weight.label,
			},
			'&[data-selected="true"][data-focus-visible="true"]:not([data-disabled="true"])': {
				backgroundColor: vars.color.intent.accent.surface.subtlePressed,
			},
		},
	},
	defaultVariants: { size: 'medium' },
	variants: {
		size: {
			medium: {
				...vars.font[200],
				minBlockSize: vars.controlSize.medium,
				paddingBlock: vars.space[200],
				paddingInline: vars.space[300],
			},
			small: {
				...vars.font[200],
				minBlockSize: vars.controlSize.small,
				paddingBlock: vars.space[100],
				paddingInline: vars.space[300],
			},
		},
	},
});

export type ComboboxVariants = RecipeVariants<typeof comboboxControl>;

export function combobox(variants?: ComboboxVariants): {
	clearButton: () => string;
	control: () => string;
	emptyState: () => string;
	item: () => string;
	itemCheck: () => string;
	listBox: () => string;
	loadMoreItem: () => string;
	popover: () => string;
	root: () => string;
	section: () => string;
	sectionHeading: () => string;
	textInput: () => string;
	trigger: () => string;
} {
	return {
		clearButton: () => comboboxClearButton(variants),
		control: () => comboboxControl(variants),
		emptyState: () => comboboxEmptyState(),
		item: () => comboboxItem(variants),
		itemCheck: () => comboboxItemCheck,
		listBox: () => comboboxListBox(),
		loadMoreItem: () => comboboxLoadMoreItem(variants),
		popover: () => comboboxPopover(),
		root: () => comboboxRoot,
		section: () => comboboxSection(),
		sectionHeading: () => comboboxSectionHeading,
		textInput: () => comboboxTextInput(variants),
		trigger: () => comboboxTrigger(variants),
	};
}
