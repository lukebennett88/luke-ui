import { defineSlotRecipe } from '@pandacss/dev';
import type { ColorToken } from '../../styled-system/tokens/index.mjs';
import type { SystemStyleObject } from '../../styled-system/types/system-types.d.mts';
import { focusRing } from '../styles/focus-ring.js';
import type { ControlSize, ControlSizeToken } from '../types/token-unions.js';

type ComboboxSlot =
	| 'clearButton'
	| 'control'
	| 'emptyState'
	| 'item'
	| 'itemCheck'
	| 'listBox'
	| 'loadMoreItem'
	| 'popover'
	| 'root'
	| 'section'
	| 'sectionHeading'
	| 'textInput'
	| 'trigger';

const comboboxTrayViewportHeightVar = '--luke-ui-visual-viewport-height';
const comboboxTrayKeyboardInsetVar = '--luke-ui-keyboard-inset';
const trayMediaQuery = '(width < 40rem)';

const disabled =
	'&:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]), :has(button:disabled), :has([data-disabled="true"]))';
const focusWithin =
	'&:where([data-focus-within="true"], :focus-within):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]), :has(button:disabled), :has([data-disabled="true"])))';
const hover =
	'&:where([data-hovered="true"], :hover):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]), :has(button:disabled), :has([data-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within)):not(:where([data-readonly="true"], :has(input:read-only)))';
const invalid =
	'&:where([data-invalid="true"], [aria-invalid="true"], :has(:invalid), :has(input[aria-invalid="true"]), :has([data-invalid="true"]), :has([aria-invalid="true"])):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]), :has(button:disabled), :has([data-disabled="true"])))';
const invalidFocusWithin =
	'&:where([data-invalid="true"], [aria-invalid="true"], :has(:invalid), :has(input[aria-invalid="true"]), :has([data-invalid="true"]), :has([aria-invalid="true"])):where([data-focus-within="true"], :focus-within):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]), :has(button:disabled), :has([data-disabled="true"])))';
const readOnly =
	'&:where([data-readonly="true"], :has(input:read-only)):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]), :has(button:disabled), :has([data-disabled="true"])))';
const readOnlyFocusWithin =
	'&:where([data-readonly="true"], :has(input:read-only)):where([data-focus-within="true"], :focus-within):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]), :has(button:disabled), :has([data-disabled="true"])))';

const controlSizeTokens = {
	medium: 'controlSize.medium',
	small: 'controlSize.small',
} as const satisfies { [Size in ControlSize]: ControlSizeToken<Size> };

const comboboxActionStyles = {
	'@media (forced-colors: active)': {
		backgroundColor: 'ButtonFace',
		boxShadow: 'none',
		color: 'ButtonText',
		forcedColorAdjust: 'auto',
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
	'@media (prefers-reduced-motion: reduce)': { transform: 'none', transition: 'none' },
	alignItems: 'center',
	appearance: 'none',
	backgroundColor: 'transparent',
	borderColor: 'transparent',
	borderStyle: 'none',
	borderWidth: 0,
	borderRadius: 'detail',
	boxShadow: 'none',
	color: 'text.secondary',
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
	transitionDuration: 'fast',
	transitionProperty: 'background-color, color',
	transitionTimingFunction: 'standard',
	'&[data-disabled="true"]': { cursor: 'not-allowed' },
	'&[data-focus-visible="true"]': focusRing('border.focus' satisfies ColorToken),
	'&[data-hovered="true"]:not([data-disabled="true"])': {
		backgroundColor: 'intent.accent.surface.subtleHover',
		color: 'text.primary',
	},
	'&[data-pressed="true"]:not([data-disabled="true"])': {
		backgroundColor: 'intent.accent.surface.subtlePressed',
		color: 'text.primary',
	},
	':where([data-disabled="true"], [aria-disabled="true"]) &': { color: 'textDisabled' },
} as const satisfies SystemStyleObject;

const comboboxSizeVariants = {
	medium: {
		clearButton: { blockSize: '28px', inlineSize: '28px', paddingInline: 0 },
		control: { blockSize: controlSizeTokens.medium, fontSize: '300' },
		item: {
			fontSize: '200',
			minBlockSize: controlSizeTokens.medium,
			paddingBlock: '200',
			paddingInline: '300',
		},
		loadMoreItem: {
			minBlockSize: controlSizeTokens.medium,
			paddingBlock: '200',
			paddingInline: '300',
		},
		textInput: {
			blockSize: controlSizeTokens.medium,
			paddingInlineEnd: '300',
			paddingInlineStart: '300',
		},
		trigger: { blockSize: '28px', inlineSize: '28px', paddingInline: 0 },
	},
	small: {
		clearButton: { blockSize: '24px', inlineSize: '24px', paddingInline: 0 },
		control: {
			blockSize: controlSizeTokens.small,
			fontSize: '200',
			letterSpacing: '200',
			lineHeight: '200',
		},
		item: {
			fontSize: '200',
			minBlockSize: controlSizeTokens.small,
			paddingBlock: '100',
			paddingInline: '300',
		},
		loadMoreItem: {
			minBlockSize: controlSizeTokens.small,
			paddingBlock: '100',
			paddingInline: '200',
		},
		textInput: {
			blockSize: controlSizeTokens.small,
			paddingInlineEnd: '200',
			paddingInlineStart: '200',
		},
		trigger: { blockSize: '24px', inlineSize: '24px', paddingInline: 0 },
	},
} as const satisfies Record<ControlSize, Partial<Record<ComboboxSlot, SystemStyleObject>>>;

export const comboboxRecipe = defineSlotRecipe({
	className: 'combobox',
	description: 'Control, popup, and option styling shared by Combobox primitives.',
	slots: [
		'root',
		'control',
		'textInput',
		'trigger',
		'clearButton',
		'itemCheck',
		'popover',
		'listBox',
		'loadMoreItem',
		'section',
		'sectionHeading',
		'emptyState',
		'item',
	],
	base: {
		root: { display: 'flex', flexDirection: 'column', inlineSize: '100%', minInlineSize: 0 },
		control: {
			'@media (forced-colors: active)': {
				backgroundColor: 'Field',
				borderColor: 'FieldText',
				boxShadow: 'none',
				color: 'FieldText',
				forcedColorAdjust: 'auto',
				[disabled]: { borderColor: 'GrayText', color: 'GrayText', opacity: 1 },
				[focusWithin]: { outlineColor: 'Highlight' },
				[invalidFocusWithin]: { outlineColor: 'Highlight' },
			},
			'@media (prefers-reduced-motion: reduce)': { transition: 'none' },
			alignItems: 'center',
			backgroundColor: 'surface.recessed',
			borderColor: 'border.control',
			borderRadius: 'control',
			borderStyle: 'solid',
			borderWidth: '1px',
			boxShadow: 'recessed',
			color: 'text.primary',
			cursor: 'text',
			display: 'inline-flex',
			fontFamily: 'family',
			inlineSize: '100%',
			isolation: 'isolate',
			letterSpacing: '300',
			lineHeight: '300',
			minInlineSize: 0,
			outlineColor: 'transparent',
			outlineOffset: 0,
			outlineStyle: 'solid',
			outlineWidth: '2px',
			overflow: 'visible',
			transitionDuration: 'fast',
			transitionProperty: 'background-color, border-color, color',
			transitionTimingFunction: 'standard',
			[disabled]: { cursor: 'not-allowed', opacity: 0.55 },
			[focusWithin]: {
				borderColor: 'intent.accent.border',
				...focusRing('border.focus' satisfies ColorToken),
			},
			[hover]: { borderColor: 'intent.accent.border' },
			[invalid]: { borderColor: 'intent.danger.border' },
			[invalidFocusWithin]: {
				borderColor: 'intent.danger.border',
				...focusRing('border.focus' satisfies ColorToken),
			},
			[readOnly]: {
				backgroundColor: 'surface.canvas',
				borderColor: 'border.decorative',
				boxShadow: 'none',
			},
			[readOnlyFocusWithin]: focusRing('border.focus' satisfies ColorToken),
		},
		textInput: {
			appearance: 'none',
			backgroundColor: 'transparent',
			borderColor: 'transparent',
			borderStyle: 'none',
			borderWidth: 0,
			color: 'text.primary',
			cursor: 'text',
			flex: 1,
			fontFamily: 'inherit',
			fontSize: 'inherit',
			fontWeight: 'inherit',
			inlineSize: '100%',
			letterSpacing: 'inherit',
			lineHeight: 'inherit',
			minInlineSize: 0,
			outlineColor: 'transparent',
			outlineStyle: 'none',
			outlineWidth: 0,
			paddingBlockEnd: 0,
			paddingBlockStart: 0,
			'&::placeholder': { color: 'text.secondary', opacity: 1 },
			'&:where([data-disabled="true"], :disabled)': {
				color: 'textDisabled',
				cursor: 'not-allowed',
			},
		},
		trigger: {
			...comboboxActionStyles,
			marginInlineEnd: '100',
			marginInlineStart: '100',
			'&:first-child': {
				color: 'text.primary',
				inlineSize: '100%',
				justifyContent: 'space-between',
				marginInline: 0,
			},
		},
		clearButton: comboboxActionStyles,
		itemCheck: { flexShrink: 0, marginInlineStart: 'auto' },
		popover: {
			'@media (forced-colors: active)': {
				backgroundColor: 'Canvas',
				borderColor: 'CanvasText',
				boxShadow: 'none',
				forcedColorAdjust: 'auto',
			},
			[`@media ${trayMediaQuery}`]: {
				borderEndEndRadius: 0,
				borderEndStartRadius: 0,
				borderStartEndRadius: 'overlay',
				borderStartStartRadius: 'overlay',
				boxShadow: 'var(--shadows-floating), 0 0 0 100vmax rgb(0 0 0 / 20%)',
				inlineSize: 'auto !important',
				insetBlockEnd: `var(${comboboxTrayKeyboardInsetVar}, 0px) !important`,
				insetBlockStart: 'auto !important',
				insetInline: '0 !important',
				maxBlockSize: `calc(var(${comboboxTrayViewportHeightVar}, 100dvh) - var(--spacing-800)) !important`,
				minInlineSize: 'auto !important',
				paddingBlockEnd: 'env(safe-area-inset-bottom, 0px)',
				position: 'fixed !important',
				'&::before': {
					alignSelf: 'center',
					backgroundColor: 'border.decorative',
					blockSize: '4px',
					borderRadius: 'full',
					content: '""',
					flexShrink: 0,
					inlineSize: '36px',
					marginBlockEnd: '100',
					marginBlockStart: '200',
				},
				'&[data-entering]': {
					boxShadow: 'var(--shadows-floating), 0 0 0 100vmax transparent',
					opacity: 1,
					translate: '0 100%',
				},
				'&[data-exiting]': {
					boxShadow: 'var(--shadows-floating), 0 0 0 100vmax transparent',
					opacity: 1,
					translate: '0 100%',
				},
			},
			'@media (prefers-reduced-motion: reduce)': {
				transition: 'none',
				'&[data-entering]': { opacity: 1, translate: 'none' },
				'&[data-exiting]': { opacity: 1, translate: 'none' },
			},
			backgroundColor: 'surface.floating',
			borderColor: 'border.decorative',
			borderRadius: 'surface',
			borderStyle: 'solid',
			borderWidth: '1px',
			boxShadow: 'floating',
			display: 'flex',
			flexDirection: 'column',
			inlineSize: 'var(--trigger-width)',
			isolation: 'isolate',
			minInlineSize: 'var(--trigger-width)',
			overflow: 'hidden',
			transitionDuration: 'fast',
			transitionProperty: 'opacity, translate, box-shadow',
			transitionTimingFunction: 'standard',
			'&[data-entering]': { opacity: 0 },
			'&[data-exiting]': { opacity: 0 },
			'@supports (min-block-size: calc-size(fit-content, size))': {
				minBlockSize: 'calc-size(fit-content, min(size, 12em))',
			},
		},
		listBox: {
			[`@media ${trayMediaQuery}`]: { maxBlockSize: 'none' },
			boxSizing: 'border-box',
			flex: 1,
			inlineSize: '100%',
			listStyle: 'none',
			margin: 0,
			maxBlockSize: '18.75rem',
			minBlockSize: 0,
			outline: 'none',
			overflow: 'auto',
			padding: '100',
		},
		loadMoreItem: {
			alignItems: 'center',
			color: 'text.secondary',
			display: 'flex',
			inlineSize: '100%',
			justifyContent: 'center',
			minInlineSize: 0,
		},
		section: {
			display: 'flex',
			flexDirection: 'column',
			gap: '100',
			paddingBlock: '200',
			'& + &': {
				borderBlockStartColor: 'border.decorative',
				borderBlockStartStyle: 'solid',
				borderBlockStartWidth: '1px',
			},
		},
		sectionHeading: {
			color: 'text.secondary',
			fontSize: '200',
			letterSpacing: '200',
			lineHeight: '200',
			fontWeight: 'label',
			paddingBlockEnd: '100',
			paddingBlockStart: 0,
			paddingInline: '300',
		},
		emptyState: {
			alignItems: 'center',
			color: 'text.secondary',
			display: 'flex',
			fontSize: '200',
			letterSpacing: '200',
			lineHeight: '200',
			justifyContent: 'center',
			paddingBlock: '600',
			paddingInline: '300',
			textAlign: 'center',
		},
		item: {
			'@media (forced-colors: active)': {
				forcedColorAdjust: 'auto',
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
			'@media (prefers-reduced-motion: reduce)': { transform: 'none', transition: 'none' },
			alignItems: 'center',
			backgroundColor: 'transparent',
			borderRadius: 'control',
			color: 'text.primary',
			cursor: 'default',
			display: 'flex',
			gap: '200',
			inlineSize: '100%',
			minBlockSize: '24px',
			minInlineSize: 0,
			outline: 'none',
			transform: 'none',
			transitionDuration: 'fast',
			transitionProperty: 'background-color, color, opacity',
			transitionTimingFunction: 'standard',
			'&[data-disabled="true"]': { color: 'textDisabled', cursor: 'not-allowed', opacity: 0.55 },
			'&[data-focused="true"]:not([data-disabled="true"])': {
				backgroundColor: 'intent.neutral.surface.subtle',
			},
			'&[data-hovered="true"]:not([data-disabled="true"])': {
				backgroundColor: 'intent.neutral.surface.subtleHover',
			},
			'&[data-focus-visible="true"]:not([data-disabled="true"])': {
				backgroundColor: 'intent.accent.surface.subtleHover',
			},
			'&[data-selected="true"]:not([data-disabled="true"])': {
				backgroundColor: 'intent.accent.surface.subtle',
				fontWeight: 'label',
			},
			'&[data-selected="true"][data-focus-visible="true"]:not([data-disabled="true"])': {
				backgroundColor: 'intent.accent.surface.subtlePressed',
			},
		},
	},
	defaultVariants: { size: 'medium' },
	variants: { size: comboboxSizeVariants },
});
