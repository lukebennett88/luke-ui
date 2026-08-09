import type { StyleRule } from '@vanilla-extract/css';
import { createVar } from '@vanilla-extract/css';
import { COMBOBOX_ICON_SIZE } from '../sizing/combobox-sizing.js';
import { focusRing, restingFocusRing } from '../styles/focus-ring.js';
import { styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';
import {
	composeInputStateSelectors,
	descendantDisabledSelector,
	inputStates,
} from './input-states.js';
import { invalidIndicatorIcon, invalidIndicatorIconForcedColors } from './invalid-indicator.js';
import type { RecipeSelection, SlottedConfigInput } from './recipe.js';
import { recipe } from './recipe.js';

// Set per `size` variant on `inputGroup` below, from `COMBOBOX_ICON_SIZE`, so the invalid
// `::after` icon matches the trigger/clear chevrons at each size instead of a constant.
const comboboxErrorIconSize = createVar();

// React Aria's `ComboBox` publishes `isDisabled`/`isInvalid` through `GroupContext`, which
// `Group` writes onto the group element, so no `:has()` probing of descendants is needed.
const { disabled, focusWithin, hover, invalid, invalidFocusWithin, readOnly, readOnlyFocusWithin } =
	composeInputStateSelectors(inputStates);

const comboboxActionStyles = {
	'@media': {
		'(forced-colors: active)': {
			backgroundColor: 'ButtonFace',
			boxShadow: 'none',
			color: 'ButtonText',
			forcedColorAdjust: 'auto',
			selectors: {
				'&[data-disabled="true"]': { color: 'GrayText', opacity: 1 },
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
	minBlockSize: vars.controlSize.minTarget,
	minInlineSize: vars.controlSize.minTarget,
	// The invalid `::after` icon on `inputGroup` below is its last DOM child (a
	// pseudo-element always renders after real children), which put it after both
	// action buttons too. Giving them an explicit `order` moves them behind the icon
	// (default `order: 0`) in flex layout without touching document order, so the
	// icon lands right after the text input and before the clear/trigger buttons.
	order: 1,
	transform: 'none',
	transitionDuration: vars.motion.duration.feedback,
	transitionProperty: 'background-color, color',
	transitionTimingFunction: vars.motion.easing.standard,

	selectors: {
		'&[data-disabled="true"]': { cursor: 'not-allowed' },
		'&[data-hovered="true"]:not([data-disabled="true"])': {
			backgroundColor: vars.color.background.accent.subtle.hover,
			color: vars.color.text.primary,
		},
		'&[data-pressed="true"]:not([data-disabled="true"])': {
			backgroundColor: vars.color.background.accent.subtle.pressed,
			color: vars.color.text.primary,
		},
		[descendantDisabledSelector]: { color: vars.color.text.disabled },
	},
} satisfies StyleRule;

const comboboxActionClassName = styleInLayer('recipes', comboboxActionStyles);

const comboboxActionSizeClassName = styleInLayer('recipes', {
	blockSize: vars.controlSize.minTarget,
	inlineSize: vars.controlSize.minTarget,
	paddingInline: 0,
});

// Medium stays above the tap-target floor so the trailing chevron keeps the same 8px
// inset as `InputGroup`'s invalid indicator: (28 − 20px icon) ÷ 2 plus the 4px
// `space[100]` trigger gap. Shrinking to the 24px floor would pull it to 6px and break
// that cross-control alignment. Tokenised as `controlSize.comboboxAction` so the sizing
// flows from the theme contract rather than a recipe-local literal.
const comboboxActionSizeClassNameMedium = styleInLayer('recipes', {
	blockSize: vars.controlSize.comboboxAction,
	inlineSize: vars.controlSize.comboboxAction,
	paddingInline: 0,
});

/**
 * Raw slotted config for the combobox anatomy.
 *
 * Slots follow the anatomy top to bottom: `root`, `inputGroup`, `textInput`,
 * `trigger`, `clearButton`, `itemCheck`, `popover`, `listBox`, `loadMoreItem`,
 * `section`, `sectionHeading`, `emptyState`, `item`, then mobile-only slots.
 */
const comboboxConfig = {
	slots: {
		root: {
			display: 'flex',
			flexDirection: 'column',
			inlineSize: '100%',
			minInlineSize: 0,
		},
		inputGroup: {
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
						// `invalidFocusWithin` is a strict subset of `invalid` and nothing else
						// here touches `::after`, so this already covers the focused case.
						[`${invalid}::after`]: invalidIndicatorIconForcedColors,
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
			fontFamily: vars.font.family.body,
			inlineSize: '100%',
			isolation: 'isolate',
			letterSpacing: vars.font[300].letterSpacing,
			lineHeight: vars.font[300].lineHeight,
			minInlineSize: 0,
			...restingFocusRing('0px'),
			overflow: 'visible',
			transitionDuration: vars.motion.duration.feedback,
			transitionProperty: 'background-color, border-color, color',
			transitionTimingFunction: vars.motion.easing.standard,

			selectors: {
				[disabled]: { cursor: 'not-allowed', opacity: vars.interaction.disabledOpacity },
				[focusWithin]: {
					borderColor: vars.color.border.accent,
					...focusRing(vars.color.border.focus),
				},
				[hover]: { borderColor: vars.color.border.accent },
				// The border stays at the resting 1px here: the in-control icon just below
				// (`::after`) is the non-colour cue, so thickening the border as well would
				// be redundant. The gated danger colour is what satisfies the contrast
				// requirement, and it is unchanged.
				[invalid]: {
					borderColor: vars.color.background.danger.solid.rest,
				},
				// `invalidFocusWithin` is a strict subset of `invalid` and nothing else
				// here touches `::after`, so this already covers the focused case.
				[`${invalid}::after`]: invalidIndicatorIcon(comboboxErrorIconSize),
				[invalidFocusWithin]: {
					borderColor: vars.color.background.danger.solid.rest,
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
		trigger: [
			comboboxActionClassName,
			{ marginInlineEnd: vars.space[100], marginInlineStart: vars.space[100] },
		],
		clearButton: comboboxActionClassName,
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
				`opacity ${vars.motion.duration.feedback} ${vars.motion.easing.standard}`,
				`translate ${vars.motion.duration.feedback} ${vars.motion.easing.standard}`,
				`box-shadow ${vars.motion.duration.feedback} ${vars.motion.easing.standard}`,
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
			minBlockSize: vars.controlSize.minTarget,
			minInlineSize: 0,
			outline: 'none',
			transform: 'none',
			transitionDuration: vars.motion.duration.feedback,
			transitionProperty: 'background-color, color, opacity',
			transitionTimingFunction: vars.motion.easing.standard,

			selectors: {
				'&[data-disabled="true"]': {
					color: vars.color.text.disabled,
					cursor: 'not-allowed',
					opacity: vars.interaction.disabledOpacity,
				},
				'&[data-focused="true"]:not([data-disabled="true"])': {
					backgroundColor: vars.color.background.neutral.subtle.rest,
				},
				'&[data-hovered="true"]:not([data-disabled="true"])': {
					backgroundColor: vars.color.background.neutral.subtle.hover,
				},
				'&[data-focus-visible="true"]:not([data-disabled="true"])': {
					backgroundColor: vars.color.background.accent.subtle.hover,
				},
				'&[data-selected="true"]:not([data-disabled="true"])': {
					backgroundColor: vars.color.background.accent.subtle.rest,
					fontWeight: vars.font.weight.label,
				},
				'&[data-selected="true"][data-focus-visible="true"]:not([data-disabled="true"])': {
					backgroundColor: vars.color.background.accent.subtle.pressed,
				},
			},
		},
		mobileInputGroup: {
			flexShrink: 0,
			inlineSize: 'auto',
			marginBlock: vars.space[300],
			marginInline: vars.space[300],
		},
		mobileListBox: {
			maxBlockSize: 'none',
			overscrollBehavior: 'contain',
		},
		mobileTrigger: {
			alignItems: 'center',
			blockSize: '100%',
			color: vars.color.text.primary,
			display: 'flex',
			inlineSize: '100%',
			justifyContent: 'space-between',
			marginInline: 0,
			minInlineSize: `calc(20ch + ${vars.controlSize.comboboxAction})`,
		},
		mobileValue: {
			flex: 1,
			minInlineSize: 0,
			overflow: 'hidden',
			textAlign: 'start',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap',
		},
	},
	defaultVariants: { size: 'medium' },
	variants: {
		size: {
			medium: {
				inputGroup: {
					blockSize: vars.controlSize.medium,
					fontSize: vars.font[300].fontSize,
					vars: { [comboboxErrorIconSize]: vars.iconSize[COMBOBOX_ICON_SIZE.medium] },
				},
				textInput: {
					blockSize: vars.controlSize.medium,
					paddingInlineEnd: vars.space[300],
					paddingInlineStart: vars.space[300],
				},
				trigger: comboboxActionSizeClassNameMedium,
				clearButton: comboboxActionSizeClassNameMedium,
				loadMoreItem: {
					minBlockSize: vars.controlSize.medium,
					paddingBlock: vars.space[200],
					paddingInline: vars.space[300],
				},
				mobileTrigger: {
					paddingInlineEnd: vars.space[300],
					paddingInlineStart: vars.space[300],
				},
				item: {
					...vars.font[200],
					minBlockSize: vars.controlSize.medium,
					paddingBlock: vars.space[200],
					paddingInline: vars.space[300],
				},
			},
			small: {
				inputGroup: {
					blockSize: vars.controlSize.small,
					...vars.font[200],
					vars: { [comboboxErrorIconSize]: vars.iconSize[COMBOBOX_ICON_SIZE.small] },
				},
				textInput: {
					blockSize: vars.controlSize.small,
					paddingInlineEnd: vars.space[200],
					paddingInlineStart: vars.space[200],
				},
				trigger: comboboxActionSizeClassName,
				clearButton: comboboxActionSizeClassName,
				loadMoreItem: {
					minBlockSize: vars.controlSize.small,
					paddingBlock: vars.space[100],
					paddingInline: vars.space[200],
				},
				mobileTrigger: {
					paddingInlineEnd: vars.space[200],
					paddingInlineStart: vars.space[200],
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
