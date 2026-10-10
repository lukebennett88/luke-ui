import type { StyleRule } from '@vanilla-extract/css';
import { vars } from '../../../theme/contract.css.js';
import { FONT_METRIC_SCALE } from '../../../theme/font-metric-scale.js';
import { COMBOBOX_ACTION_SIZE } from '../../sizing/combobox-sizing.js';
import { MIN_TARGET_SIZE } from '../../sizing/control-size.js';
import { focusRing } from '../../styles/focus-ring.js';
import {
	composeInputStateSelectors,
	descendantDisabledSelector,
} from '../../styles/input-states.js';
import {
	overlayEnterTransition,
	overlayExitTransition,
	reducedMotionOverlayProperties,
} from '../../styles/overlay-motion.js';
import type { SlottedConfigInput } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';

// React Aria publishes disabled and invalid state on the group, so those states
// do not need to probe descendants.
const { disabled, focusWithin, hover, invalid, readOnly } = composeInputStateSelectors();

// The well ring tracks the text input so inner actions do not paint a second ring.
const inputFocus = `${focusWithin}:has(input:focus)`;

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
	},
	alignItems: 'center',
	appearance: 'none',
	backgroundColor: 'transparent',
	border: 'none',
	borderRadius: vars.radius.detail,
	boxShadow: 'none',
	color: vars.color.text.secondary,
	display: 'inline-flex',
	flexShrink: 0,
	fontFamily: 'inherit',
	fontSize: 'inherit',
	fontWeight: 'inherit',
	justifyContent: 'center',
	minBlockSize: MIN_TARGET_SIZE,
	minInlineSize: MIN_TARGET_SIZE,
	paddingBlock: 0,
	touchAction: 'manipulation',
	transform: 'none',
	transitionDuration: vars.motion.duration.feedback,
	transitionProperty: 'background-color, color',
	// Hover and pressed states give their own feedback, so the browser's tap highlight would double it.
	WebkitTapHighlightColor: 'transparent',
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

// The popover is an overlay, so it takes the shared overlay motion roles. See
// `styles/overlay-motion.ts` for the roles and the reduced-motion rule that follows from them.
const popoverProperties = ['opacity', 'translate', 'box-shadow'];
const popoverTransition = overlayEnterTransition(popoverProperties);
const popoverExitTransition = overlayExitTransition(popoverProperties);
const popoverReducedTransition = overlayEnterTransition(reducedMotionOverlayProperties);
const popoverReducedExitTransition = overlayExitTransition(reducedMotionOverlayProperties);

/**
 * Raw slotted config for the combobox anatomy.
 *
 * Slots follow the anatomy top to bottom: `root`, `control`, `textInput`,
 * `trigger`, `clearButton`, `itemCheck`, `popover`, `listBox`, `loadMoreItem`,
 * `section`, `sectionHeading`, `emptyState`, `item`, then the tray-only parts.
 *
 * `control` and `listBox` use a `presentation` variant for tray styles. `trayTrigger` and
 * `trayValue` are tray-only slots.
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
						[inputFocus]: { outlineColor: 'Highlight' },
					},
				},
			},
			alignItems: 'center',
			backgroundColor: vars.color.surface.field,
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
			letterSpacing: FONT_METRIC_SCALE[16].letterSpacing,
			lineHeight: FONT_METRIC_SCALE[16].lineHeight,
			minInlineSize: 0,
			overflow: 'visible',
			transitionDuration: vars.motion.duration.feedback,
			transitionProperty: 'background-color, border-color, box-shadow, color',
			transitionTimingFunction: vars.motion.easing.standard,

			// Precedence: invalid beats read-only and hover. Focus only adds the ring, so it composes
			// with every state. Opening the popover adds no border state of its own.
			selectors: {
				[disabled]: { cursor: 'not-allowed', opacity: vars.interaction.disabledOpacity },
				[inputFocus]: focusRing(vars.color.border.focus),
				[hover]: { borderColor: vars.color.border.controlHover },
				// Read-only drops the inset depth. The hover selector already excludes it.
				[readOnly]: { boxShadow: 'none' },
				// The field's error message carries the non-colour invalid cue, so the border keeps
				// its resting width and only takes the danger colour.
				[invalid]: {
					borderColor: vars.color.background.danger.solid.rest,
				},
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
		trigger: { marginInlineEnd: vars.space.sp4, marginInlineStart: vars.space.sp4 },
		clearButton: {},
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
				// The fade stays and the movement goes. See `styles/overlay-motion.ts`.
				'(prefers-reduced-motion: reduce)': {
					transition: popoverReducedTransition,
					selectors: {
						'&[data-entering]': { translate: 'none' },
						'&[data-exiting]': { transition: popoverReducedExitTransition, translate: 'none' },
					},
				},
			},
			backgroundColor: vars.color.surface.overlay,
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
			transition: popoverTransition,

			selectors: {
				'&[data-entering]': { opacity: 0 },
				'&[data-exiting]': { opacity: 0, transition: popoverExitTransition },
			},

			'@supports': {
				'(min-block-size: calc-size(fit-content, size))': {
					minBlockSize: 'calc-size(fit-content, min(size, 12em))',
				},
			},
		},
		listBox: {
			flex: 1,
			inlineSize: '100%',
			listStyle: 'none',
			margin: 0,
			maxBlockSize: '18.75rem',
			minBlockSize: 0,
			outline: 'none',
			overflow: 'auto',
			padding: vars.space.sp4,
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
			gap: vars.space.sp4,
			paddingBlock: vars.space.sp8,
		},
		sectionHeading: {
			color: vars.color.text.secondary,
			...vars.font.label,
			paddingBlockEnd: vars.space.sp4,
			paddingBlockStart: 0,
			paddingInline: vars.space.sp12,
		},
		emptyState: {
			alignItems: 'center',
			color: vars.color.text.secondary,
			display: 'flex',
			...vars.font.label,
			justifyContent: 'center',
			paddingBlock: vars.space.sp24,
			paddingInline: vars.space.sp12,
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
			},
			alignItems: 'center',
			backgroundColor: 'transparent',
			borderRadius: vars.radius.control,
			color: vars.color.text.primary,
			cursor: 'default',
			display: 'flex',
			gap: vars.space.sp8,
			inlineSize: '100%',
			minBlockSize: MIN_TARGET_SIZE,
			minInlineSize: 0,
			outline: 'none',
			touchAction: 'manipulation',
			transform: 'none',
			transitionDuration: vars.motion.duration.feedback,
			transitionProperty: 'background-color, color, opacity',
			transitionTimingFunction: vars.motion.easing.standard,
			// Hover and pressed states give their own feedback, so the browser's tap highlight would
			// double it.
			WebkitTapHighlightColor: 'transparent',

			selectors: {
				'&[data-disabled="true"]': {
					color: vars.color.text.disabled,
					cursor: 'not-allowed',
					opacity: vars.interaction.disabledOpacity,
				},
				'&[data-focused="true"]:not([data-disabled="true"]):not([data-selected="true"])': {
					backgroundColor: vars.color.background.neutral.subtle.rest,
				},
				'&[data-hovered="true"]:not([data-disabled="true"]):not([data-selected="true"])': {
					backgroundColor: vars.color.background.neutral.subtle.hover,
				},
				'&[data-pressed="true"]:not([data-disabled="true"]):not([data-selected="true"])': {
					backgroundColor: vars.color.background.neutral.subtle.pressed,
				},
				'&[data-focus-visible="true"]:not([data-disabled="true"])': {
					backgroundColor: vars.color.background.accent.subtle.hover,
				},
				'&[data-selected="true"]:not([data-disabled="true"])': {
					backgroundColor: vars.color.background.accent.subtle.rest,
					fontWeight: vars.font.weight.label,
				},
				'&[data-hovered="true"][data-selected="true"]:not([data-disabled="true"])': {
					backgroundColor: vars.color.background.accent.subtle.hover,
				},
				'&[data-pressed="true"][data-selected="true"]:not([data-disabled="true"])': {
					backgroundColor: vars.color.background.accent.subtle.pressed,
				},
				'&[data-selected="true"][data-focus-visible="true"]:not([data-disabled="true"])': {
					backgroundColor: vars.color.background.accent.subtle.pressed,
				},
			},
		},
		trayTrigger: {
			alignItems: 'center',
			appearance: 'none',
			backgroundColor: 'transparent',
			blockSize: '100%',
			border: 'none',
			color: vars.color.text.primary,
			display: 'flex',
			inlineSize: '100%',
			justifyContent: 'space-between',
			marginInline: 0,
			// `inlineSize: '100%'` resolves against a shrink-to-fit ancestor, which would collapse
			// the closed trigger onto its selected value. This floor reserves 20ch of value text
			// plus room for the trailing chevron.
			minInlineSize: `calc(20ch + ${COMBOBOX_ACTION_SIZE})`,
			paddingBlock: 0,

			selectors: {
				'&[data-disabled="true"]': { cursor: 'not-allowed' },
			},
		},
		trayValue: {
			flex: 1,
			minInlineSize: 0,
			overflow: 'hidden',
			textAlign: 'start',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap',
		},
	},
	defaultVariants: { presentation: 'popover', size: 'medium' },
	variants: {
		presentation: {
			popover: {},
			tray: {
				control: {
					flexShrink: 0,
					inlineSize: 'auto',
					marginBlock: vars.space.sp12,
					marginInline: vars.space.sp12,
				},
				listBox: {
					maxBlockSize: 'none',
					overscrollBehavior: 'contain',
				},
			},
		},
		size: {
			medium: {
				control: {
					blockSize: vars.controlSize.medium,
					fontSize: FONT_METRIC_SCALE[16].fontSize,
				},
				textInput: {
					blockSize: vars.controlSize.medium,
					paddingInlineEnd: vars.space.sp12,
					paddingInlineStart: vars.space.sp12,
				},
				loadMoreItem: {
					minBlockSize: vars.controlSize.medium,
					paddingBlock: vars.space.sp8,
					paddingInline: vars.space.sp12,
				},
				trayTrigger: {
					paddingInlineEnd: vars.space.sp12,
					paddingInlineStart: vars.space.sp12,
				},
				item: {
					...vars.font.label,
					fontWeight: vars.font.weight.body,
					minBlockSize: vars.controlSize.medium,
					paddingBlock: vars.space.sp8,
					paddingInline: vars.space.sp12,
				},
			},
			small: {
				control: {
					blockSize: vars.controlSize.small,
					fontSize: FONT_METRIC_SCALE[14].fontSize,
					letterSpacing: FONT_METRIC_SCALE[14].letterSpacing,
					lineHeight: FONT_METRIC_SCALE[14].lineHeight,
				},
				textInput: {
					blockSize: vars.controlSize.small,
					paddingInlineEnd: vars.space.sp8,
					paddingInlineStart: vars.space.sp8,
				},
				loadMoreItem: {
					minBlockSize: vars.controlSize.small,
					paddingBlock: vars.space.sp4,
					paddingInline: vars.space.sp8,
				},
				trayTrigger: {
					paddingInlineEnd: vars.space.sp8,
					paddingInlineStart: vars.space.sp8,
				},
				item: {
					...vars.font.label,
					fontWeight: vars.font.weight.body,
					minBlockSize: vars.controlSize.small,
					paddingBlock: vars.space.sp4,
					paddingInline: vars.space.sp12,
				},
			},
		},
	},
	compoundSlots: [
		// The trigger and clear button share their action styles and sizes.
		{ slots: ['trigger', 'clearButton'], style: comboboxActionStyles },
		// The medium action size gives a 20px icon an 8px inset from the control edge:
		// (28px − 20px) ÷ 2 + the 4px trigger gap.
		{
			slots: ['trigger', 'clearButton'],
			style: {
				blockSize: COMBOBOX_ACTION_SIZE,
				inlineSize: COMBOBOX_ACTION_SIZE,
				paddingInline: 0,
			},
			variants: { size: 'medium' },
		},
		{
			slots: ['trigger', 'clearButton'],
			style: {
				blockSize: MIN_TARGET_SIZE,
				inlineSize: MIN_TARGET_SIZE,
				paddingInline: 0,
			},
			variants: { size: 'small' },
		},
	],
} as const satisfies SlottedConfigInput;

/**
 * Slotted recipe for the combobox anatomy. Internal — not exported from a public entrypoint.
 */
export const comboboxRecipe = recipe(comboboxConfig);

/** Allowed `presentation` values for the combobox recipe. */
export type ComboboxPresentation = keyof typeof comboboxConfig.variants.presentation;

/** Allowed `size` values for the combobox recipe. */
export type ComboboxSize = keyof typeof comboboxConfig.variants.size;
