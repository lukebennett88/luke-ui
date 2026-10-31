import type { StyleRule } from '@vanilla-extract/css';
import { createVar } from '@vanilla-extract/css';
import { vars } from '../../../theme/contract.css.js';
import { FONT_METRIC_SCALE } from '../../../theme/font-metric-scale.js';
import { MOTION_DURATION_SCALE } from '../../../theme/motion.js';
import { COMBOBOX_ACTION_SIZE } from '../../sizing/combobox-sizing.js';
import { MIN_TARGET_SIZE } from '../../sizing/control-size.js';
import { classSelector } from '../../styles/class-selector.js';
import { focusRing } from '../../styles/focus-ring.js';
import {
	composeInputStateSelectors,
	descendantDisabledSelector,
} from '../../styles/input-states.js';
import { INTERACTION_STATE_LAYER_PROPERTY } from '../../styles/interaction-state-layer.js';
import { globalStyleInLayer, style } from '../../styles/layered-style.css.js';
import { overlayMotion } from '../../styles/overlay-motion.js';
import { pressFeedback } from '../../styles/press-feedback.js';
import type { SlottedConfigInput } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';
import { interactionStateLayer } from '../../styles/state-layer.css.js';
import { adaptiveStateLayer } from '../../styles/state-layer.js';
import { surfaceStyle } from '../../styles/surface.js';
import {
	autofilledDisabledInputSelector,
	autofilledDisabledInputStyle,
	autofilledInputSelector,
	autofilledInputStyle,
	filledInputSelectors,
	filledInputStyle,
} from '../text-input/styles.css.js';

// The popover starts this far from its resting place, on the side facing the trigger. React Aria
// publishes the resolved placement, so a flipped popover slides in from the flipped side.
const POPOVER_SLIDE_DISTANCE = '4px';
const popoverSlideVar = createVar();
const raisedSurface = surfaceStyle('surface.raised');

/** Set by Select/Combobox popovers to the usable overlay inline size. */
export const popoverAvailableInlineSizeVar = createVar();

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
	backgroundImage: `linear-gradient(${interactionStateLayer}, ${interactionStateLayer})`,
	border: 'none',
	borderRadius: vars.radius.detail,
	boxShadow: 'none',
	color: vars.color.foreground.secondary,
	display: 'inline-flex',
	flexShrink: 0,
	fontFamily: 'inherit',
	fontSize: 'inherit',
	fontWeight: 'inherit',
	justifyContent: 'center',
	minBlockSize: MIN_TARGET_SIZE,
	minInlineSize: MIN_TARGET_SIZE,
	paddingBlock: 0,
	...pressFeedback,
	transform: 'none',
	transitionDuration: vars.motion.feedback.duration,
	transitionProperty: `background-color, background-image, color, ${INTERACTION_STATE_LAYER_PROPERTY}`,
	transitionTimingFunction: vars.motion.feedback.easing,

	vars: { [interactionStateLayer]: 'transparent' },
	selectors: {
		'&[data-disabled="true"]': { cursor: 'not-allowed' },
		'&[data-hovered="true"]:not([data-disabled="true"])': adaptiveStateLayer('hover'),
		'&[data-pressed="true"]:not([data-disabled="true"])': adaptiveStateLayer('pressed'),
		[descendantDisabledSelector]: { color: vars.color.foreground.disabled },
	},
} satisfies StyleRule;

// The trigger and clear button share these dimensions. The medium size gives a 20px icon an 8px
// inset from the control edge: (28px − 20px) ÷ 2 + the 4px trigger gap.
const comboboxActionSizes = {
	medium: { blockSize: COMBOBOX_ACTION_SIZE, inlineSize: COMBOBOX_ACTION_SIZE, paddingInline: 0 },
	small: { blockSize: MIN_TARGET_SIZE, inlineSize: MIN_TARGET_SIZE, paddingInline: 0 },
} satisfies Record<string, StyleRule>;

/** Marker class on every combobox and select item, for rules that reach into its content. */
export const comboboxItemClassName = style({}, 'combobox-item');

// The active item's `forced-color-adjust: none` inherits, so its content would keep author colours on
// the `Highlight` fill: a `Text` keeps its theme colour and a `Kbd` its surface. Do for that content
// what forced colours would have done. `!important` beats application and utility CSS, which ranks
// below every Luke UI layer under `!important`.
globalStyleInLayer(
	'recipes',
	`${classSelector(comboboxItemClassName)}[data-focused="true"]:not([data-disabled="true"]) *`,
	{
		'@media': {
			'(forced-colors: active)': {
				backgroundColor: 'transparent !important',
				borderColor: 'currentColor !important',
				color: 'inherit !important',
			},
		},
	},
);

/**
 * Raw slotted config for the combobox anatomy.
 *
 * Slots follow the anatomy top to bottom: `root`, `control`, `textInput`,
 * `trigger`, `clearButton`, `itemCheck`, `popover`, `listBox`, `loadMoreItem`,
 * `section`, `sectionHeading`, `emptyState`, `item`, then the tray-only parts.
 *
 * `control` and `listBox` use a `presentation` variant for tray styles. `trayTrigger` and
 * `trayValue` are tray-only slots. `trigger` and `clearButton` share `comboboxActionStyles` and
 * `comboboxActionSizes`.
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
			...surfaceStyle('surface.base'),
			borderColor: vars.color.border.control.rest,
			borderRadius: vars.radius.control,
			borderStyle: 'solid',
			borderWidth: '1px',
			boxShadow: vars.shadow.inset,
			cursor: 'text',
			display: 'inline-flex',
			fontFamily: vars.font.family.body,
			inlineSize: '100%',
			isolation: 'isolate',
			letterSpacing: FONT_METRIC_SCALE[16].letterSpacing,
			lineHeight: FONT_METRIC_SCALE[16].lineHeight,
			minInlineSize: 0,
			overflow: 'visible',
			transitionDuration: vars.motion.feedback.duration,
			transitionProperty: 'background-color, border-color, box-shadow, color',
			transitionTimingFunction: vars.motion.feedback.easing,

			// Precedence: invalid beats read-only and hover. Focus only adds the ring, so it composes
			// with every state. Opening the popover adds no border state of its own.
			selectors: {
				[disabled]: { cursor: 'not-allowed', opacity: vars.interaction.disabledOpacity },
				[inputFocus]: focusRing(vars.color.focus),
				[hover]: { borderColor: vars.color.border.control.hover },
				// Read-only drops the inset shadow. The hover selector already excludes it.
				[readOnly]: { boxShadow: 'none' },
				// The field's error message carries the non-colour invalid cue, so the border keeps
				// its resting width and only takes the danger colour.
				[invalid]: {
					borderColor: vars.color.border.danger.strong,
				},
			},
		},
		textInput: {
			appearance: 'none',
			backgroundColor: 'transparent',
			border: 'none',
			color: vars.color.foreground.primary,
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
				'&::placeholder': { color: vars.color.foreground.secondary, opacity: 1 },
				// Same contract as a text input: an external fill must not paint over the control.
				[`&:where(${filledInputSelectors})`]: filledInputStyle,
				[`&${autofilledInputSelector}`]: autofilledInputStyle,
				[`&${autofilledDisabledInputSelector}`]: autofilledDisabledInputStyle,
				'&:where([data-disabled="true"], :disabled)': {
					color: vars.color.foreground.disabled,
					cursor: 'not-allowed',
				},
			},
		},
		trigger: {
			marginInlineEnd: vars.space['4'],
			marginInlineStart: vars.space['4'],
			...comboboxActionStyles,
		},
		clearButton: comboboxActionStyles,
		itemCheck: {
			flexShrink: 0,
			marginInlineStart: 'auto',
		},
		// The popover is an overlay, so it takes the shared overlay motion roles. See
		// `styles/overlay-motion.ts` for the roles and the reduced-motion rule that follows from them.
		// A 4px slide is too short to carry the shared 250ms entry, so the popover enters in 150ms and
		// leaves in 100ms. Both ease out, so the exit starts moving at once.
		popover: overlayMotion({
			hidden: { opacity: 0, translate: popoverSlideVar },
			properties: ['opacity', 'translate'],
			timing: {
				enter: { duration: MOTION_DURATION_SCALE[300], easing: vars.motion.enter.easing },
				exit: { duration: MOTION_DURATION_SCALE[200], easing: vars.motion.enter.easing },
			},
			rule: {
				'@media': {
					'(forced-colors: active)': {
						backgroundColor: 'Canvas',
						borderColor: 'CanvasText',
						boxShadow: 'none',
						forcedColorAdjust: 'auto',
					},
				},
				...raisedSurface,
				borderColor: vars.color.border.decorative,
				borderRadius: vars.radius.surface,
				borderStyle: 'solid',
				borderWidth: '1px',
				boxShadow: vars.shadow.floating,
				display: 'flex',
				flexDirection: 'column',
				inlineSize: 'var(--trigger-width)',
				isolation: 'isolate',
				maxInlineSize: popoverAvailableInlineSizeVar,
				// CSS min wins over max when they conflict, so the floor needs the same cap.
				minInlineSize: `min(var(--trigger-width), ${popoverAvailableInlineSizeVar})`,
				overflow: 'hidden',
				// Merged, not replaced, so the raised surface keeps its foreground resets.
				vars: { ...raisedSurface.vars, [popoverSlideVar]: `0 -${POPOVER_SLIDE_DISTANCE}` },

				selectors: {
					'&[data-placement="top"]': {
						vars: { [popoverSlideVar]: `0 ${POPOVER_SLIDE_DISTANCE}` },
					},
					'&[data-placement="left"]': {
						vars: { [popoverSlideVar]: `${POPOVER_SLIDE_DISTANCE} 0` },
					},
					'&[data-placement="right"]': {
						vars: { [popoverSlideVar]: `-${POPOVER_SLIDE_DISTANCE} 0` },
					},
				},

				'@supports': {
					'(min-block-size: calc-size(fit-content, size))': {
						minBlockSize: 'calc-size(fit-content, min(size, 12em))',
					},
				},
			},
		}),
		listBox: {
			flex: 1,
			inlineSize: '100%',
			listStyle: 'none',
			margin: 0,
			maxBlockSize: '18.75rem',
			minBlockSize: 0,
			outline: 'none',
			overflow: 'auto',
			padding: vars.space['4'],
		},
		loadMoreItem: {
			alignItems: 'center',
			color: vars.color.foreground.secondary,
			display: 'flex',
			inlineSize: '100%',
			justifyContent: 'center',
			minInlineSize: 0,
		},
		section: {
			display: 'flex',
			flexDirection: 'column',
			gap: vars.space['4'],
			paddingBlock: vars.space['8'],
		},
		sectionHeading: {
			color: vars.color.foreground.secondary,
			...vars.font.label,
			paddingBlockEnd: vars.space['4'],
			paddingBlockStart: 0,
			paddingInline: vars.space['12'],
		},
		emptyState: {
			alignItems: 'center',
			color: vars.color.foreground.secondary,
			display: 'flex',
			...vars.font.label,
			justifyContent: 'center',
			paddingBlock: vars.space['24'],
			paddingInline: vars.space['12'],
			textAlign: 'center',
		},
		item: {
			'@media': {
				'(forced-colors: active)': {
					forcedColorAdjust: 'auto',
					selectors: {
						'&[data-disabled="true"]': { color: 'GrayText', opacity: 1 },
						// A forced-colours backplate would paint `Canvas` behind the label and hide the
						// `HighlightText` on it, so the active item opts out and sets both colours. The list
						// repeats every active-state selector below so author colours never show through.
						// The opt-out inherits, so the `comboboxItemClassName` rule resets the item's content.
						[[
							'&[data-focused="true"]:not([data-disabled="true"])',
							'&[data-focused="true"][data-pressed="true"]:not([data-disabled="true"])',
						].join(', ')]: {
							backgroundColor: 'Highlight',
							color: 'HighlightText',
							forcedColorAdjust: 'none',
							outline: '2px solid HighlightText',
							outlineOffset: '-2px',
						},
					},
				},
			},
			alignItems: 'center',
			backgroundColor: 'transparent',
			borderRadius: vars.radius.control,
			color: vars.color.foreground.primary,
			cursor: 'default',
			display: 'flex',
			gap: vars.space['8'],
			inlineSize: '100%',
			minBlockSize: MIN_TARGET_SIZE,
			minInlineSize: 0,
			outline: 'none',
			...pressFeedback,
			transform: 'none',
			transitionDuration: vars.motion.feedback.duration,
			transitionProperty: 'background-color, color, opacity, outline-color',
			transitionTimingFunction: vars.motion.feedback.easing,

			// React Aria moves the one active item (`data-focused`) with the pointer and the keyboard.
			// The solid fill plus a 2px inset outline in the on-solid foreground mark focus. Selection
			// shows only the check, and hover alone has no style.
			selectors: {
				'&[data-disabled="true"]': {
					color: vars.color.foreground.disabled,
					cursor: 'not-allowed',
					opacity: vars.interaction.disabledOpacity,
				},
				'&[data-focused="true"]:not([data-disabled="true"])': {
					...surfaceStyle('accent.solid.rest'),
					outline: `2px solid ${vars.color.foreground.accent.onSolid}`,
					outlineOffset: '-2px',
				},
				'&[data-focused="true"][data-pressed="true"]:not([data-disabled="true"])': {
					...surfaceStyle('accent.solid.pressed'),
					outline: `2px solid ${vars.color.foreground.accent.onSolid}`,
					outlineOffset: '-2px',
				},
			},
		},
		trayTrigger: {
			alignItems: 'center',
			appearance: 'none',
			backgroundColor: 'transparent',
			blockSize: '100%',
			border: 'none',
			color: vars.color.foreground.primary,
			display: 'flex',
			inlineSize: '100%',
			justifyContent: 'space-between',
			marginInline: 0,
			// `inlineSize: '100%'` resolves against a shrink-to-fit ancestor, which would collapse
			// the closed trigger onto its selected value. This floor reserves 20ch of value text
			// plus room for the trailing chevron.
			minInlineSize: `calc(20ch + ${COMBOBOX_ACTION_SIZE})`,
			paddingBlock: 0,
			...pressFeedback,

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
					marginBlock: vars.space['12'],
					marginInline: vars.space['12'],
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
					blockSize: vars.controlSize.px40,
					fontSize: FONT_METRIC_SCALE[16].fontSize,
				},
				textInput: {
					blockSize: vars.controlSize.px40,
					paddingInlineEnd: vars.space['12'],
					paddingInlineStart: vars.space['12'],
				},
				trigger: comboboxActionSizes.medium,
				clearButton: comboboxActionSizes.medium,
				loadMoreItem: {
					minBlockSize: vars.controlSize.px40,
					paddingBlock: vars.space['8'],
					paddingInline: vars.space['12'],
				},
				trayTrigger: {
					paddingInlineEnd: vars.space['12'],
					paddingInlineStart: vars.space['12'],
				},
				item: {
					...vars.font.label,
					fontWeight: vars.font.weight.body,
					minBlockSize: vars.controlSize.px40,
					paddingBlock: vars.space['8'],
					paddingInline: vars.space['12'],
				},
			},
			small: {
				control: {
					blockSize: vars.controlSize.px32,
					fontSize: FONT_METRIC_SCALE[14].fontSize,
					letterSpacing: FONT_METRIC_SCALE[14].letterSpacing,
					lineHeight: FONT_METRIC_SCALE[14].lineHeight,
				},
				textInput: {
					blockSize: vars.controlSize.px32,
					paddingInlineEnd: vars.space['8'],
					paddingInlineStart: vars.space['8'],
				},
				trigger: comboboxActionSizes.small,
				clearButton: comboboxActionSizes.small,
				loadMoreItem: {
					minBlockSize: vars.controlSize.px32,
					paddingBlock: vars.space['4'],
					paddingInline: vars.space['8'],
				},
				trayTrigger: {
					paddingInlineEnd: vars.space['8'],
					paddingInlineStart: vars.space['8'],
				},
				item: {
					...vars.font.label,
					fontWeight: vars.font.weight.body,
					minBlockSize: vars.controlSize.px32,
					paddingBlock: vars.space['4'],
					paddingInline: vars.space['12'],
				},
			},
		},
	},
} as const satisfies SlottedConfigInput;

/**
 * Slotted recipe for the combobox anatomy. Internal — not exported from a public entrypoint.
 */
export const comboboxRecipe = recipe(comboboxConfig);

/** Allowed `presentation` values for the combobox recipe. */
export type ComboboxPresentation = keyof typeof comboboxConfig.variants.presentation;

/** Allowed `size` values for the combobox recipe. */
export type ComboboxSize = keyof typeof comboboxConfig.variants.size;
