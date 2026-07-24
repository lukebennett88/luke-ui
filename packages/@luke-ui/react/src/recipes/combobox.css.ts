import type { StyleRule } from '@vanilla-extract/css';
import { focusRing } from '../styles/focus-ring.js';
import { vars } from '../theme/contract.css.js';
import {
	composeInputStateSelectors,
	descendantDisabledSelector,
	inputStates,
} from './input-states.css.js';
import type { RecipeSelection, SlottedConfigInput } from './recipe.js';
import { recipe } from './recipe.js';

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
		[descendantDisabledSelector]: { color: vars.color.text.disabled },
	},
} satisfies StyleRule;

/**
 * Raw slotted config for the combobox anatomy.
 *
 * Slots follow the anatomy top to bottom: `root`, `control`, `textInput`,
 * `trigger`, `clearButton`, `itemCheck`, `popover`, `listBox`, `loadMoreItem`,
 * `section`, `sectionHeading`, `emptyState`, `item`.
 */
const comboboxConfig = {
	slots: {
		root: {
			display: 'flex',
			flexDirection: 'column',
			inlineSize: '100%',
			minInlineSize: 0,
		},
		control: {
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
		textInput: {
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
					color: vars.color.text.disabled,
					cursor: 'not-allowed',
				},
			},
		},
		trigger: {
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
		clearButton: comboboxActionStyles,
		itemCheck: {
			flexShrink: 0,
			marginInlineStart: 'auto',
		},
		popover: {
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
					boxShadow: `${vars.depth.floating}, 0 0 0 100vmax ${vars.color.scrim}`,
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
		listBox: {
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
		loadMoreItem: {
			alignItems: 'center',
			color: vars.color.text.secondary,
			display: 'flex',
			inlineSize: '100%',
			justifyContent: 'center',
			minInlineSize: 0,
		},
		section: {
			display: 'flex',
			flexDirection: 'column',
			gap: vars.space[100],
			paddingBlock: vars.space[200],

			selectors: {
				'& + &': { borderBlockStart: `1px solid ${vars.color.border.decorative}` },
			},
		},
		sectionHeading: {
			color: vars.color.text.secondary,
			...vars.font[200],
			fontWeight: vars.font.weight.label,
			paddingBlockEnd: vars.space[100],
			paddingBlockStart: 0,
			paddingInline: vars.space[300],
		},
		emptyState: {
			alignItems: 'center',
			color: vars.color.text.secondary,
			display: 'flex',
			...vars.font[200],
			justifyContent: 'center',
			paddingBlock: vars.space[600],
			paddingInline: vars.space[300],
			textAlign: 'center',
		},
		item: {
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
					color: vars.color.text.disabled,
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
	},
	defaultVariants: { size: 'medium' },
	variants: {
		size: {
			medium: {
				control: { blockSize: vars.controlSize.medium, fontSize: vars.font[300].fontSize },
				textInput: {
					blockSize: vars.controlSize.medium,
					paddingInlineEnd: vars.space[300],
					paddingInlineStart: vars.space[300],
				},
				trigger: {
					blockSize: '28px',
					inlineSize: '28px',
					paddingInline: 0,
				},
				clearButton: { blockSize: '28px', inlineSize: '28px', paddingInline: 0 },
				loadMoreItem: {
					minBlockSize: vars.controlSize.medium,
					paddingBlock: vars.space[200],
					paddingInline: vars.space[300],
				},
				item: {
					...vars.font[200],
					minBlockSize: vars.controlSize.medium,
					paddingBlock: vars.space[200],
					paddingInline: vars.space[300],
				},
			},
			small: {
				control: {
					blockSize: vars.controlSize.small,
					...vars.font[200],
				},
				textInput: {
					blockSize: vars.controlSize.small,
					paddingInlineEnd: vars.space[200],
					paddingInlineStart: vars.space[200],
				},
				trigger: {
					blockSize: '24px',
					inlineSize: '24px',
					paddingInline: 0,
				},
				clearButton: { blockSize: '24px', inlineSize: '24px', paddingInline: 0 },
				loadMoreItem: {
					minBlockSize: vars.controlSize.small,
					paddingBlock: vars.space[100],
					paddingInline: vars.space[200],
				},
				item: {
					...vars.font[200],
					minBlockSize: vars.controlSize.small,
					paddingBlock: vars.space[100],
					paddingInline: vars.space[300],
				},
			},
		},
	},
} as const satisfies SlottedConfigInput;

/**
 * Slotted recipe for the combobox anatomy. Internal — not exported from
 * `@luke-ui/react/recipes`.
 */
export const combobox = recipe(comboboxConfig);

/** Outer variant selection for the combobox recipe. */
export type ComboboxVariants = RecipeSelection<typeof combobox>;

/** Allowed `size` values for the combobox recipe. */
export type ComboboxSize = keyof typeof comboboxConfig.variants.size;
