import { createVar, fallbackVar } from '@vanilla-extract/css';
import { vars } from '../../../theme/contract.css.js';
import { ICON_SIZES } from '../../sizing/icon-sizing.js';
import { focusRing } from '../../styles/focus-ring.js';
import type { RecipeSelection } from '../../styles/recipe-types.js';
import type { SlottedConfigInput } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';
import { textLineHeight } from '../../text/recipe.css.js';
import { inlineControlGap, inlineFieldIndent } from '../field/recipe.css.js';

const trackBlockSize = createVar();
const trackInlineSize = createVar();

const trackBorderWidth = '1px';
const thumbInset = '1px';

/** Space between the thumb and the track's inner edge, including the border. */
const thumbOffset = `calc(${trackBorderWidth} + ${thumbInset})`;
const thumbSize = `calc(${trackBlockSize} - 2 * ${thumbOffset})`;
/** How far the thumb moves along the track when the switch is on. */
const thumbTravel = `calc(${trackInlineSize} - ${trackBlockSize})`;

// React Aria drops hover while the switch is disabled or read-only, and press while it is disabled,
// so only press needs a read-only guard. Hover and pressed stay separate so each has its own look.
/** Selects a part while the switch matches `state` and is hovered. */
function hovered(state = '') {
	return `${state}[data-hovered="true"] &`;
}

/** Selects a part while the switch matches `state` and is pressed. */
function pressed(state = '') {
	return `${state}[data-pressed="true"]:not([data-readonly="true"]) &`;
}

/** Sets the track size for a size variant. The track is 1.75 times as wide as it is tall. */
function sizeVars(blockSize: string) {
	return {
		vars: {
			[trackBlockSize]: blockSize,
			[trackInlineSize]: `calc(${blockSize} * 1.75)`,
			[inlineFieldIndent]: `calc(${trackInlineSize} + ${inlineControlGap})`,
		},
	};
}

const switchConfig = {
	slots: {
		root: {
			minInlineSize: 0,
		},
		control: {
			'@media': {
				'(forced-colors: active)': {
					backgroundColor: 'Canvas',
					backgroundImage: 'none',
					borderColor: 'CanvasText',
					forcedColorAdjust: 'auto',
					// Disabled comes last so a disabled switch reads as disabled whether it is on or off.
					selectors: {
						'[data-focus-visible="true"] &': {
							outlineColor: 'Highlight',
						},
						'[data-selected="true"] &, [data-invalid="true"][data-selected="true"] &': {
							backgroundColor: 'Highlight',
							borderColor: 'Highlight',
						},
						'[data-disabled="true"] &': {
							backgroundColor: 'Canvas',
							borderColor: 'GrayText',
							opacity: 1,
						},
					},
				},
				'(prefers-reduced-motion: reduce)': {
					transition: 'none',
				},
			},
			// Off, the track is filled with the guaranteed control boundary colour and sits in as a well.
			// On, it is a solid fill with the control finish. Hover and pressed change colour, so they
			// stay distinct when a theme sets every material to `none`.
			alignItems: 'center',
			backgroundColor: vars.color.border.control,
			backgroundImage: 'none',
			blockSize: trackBlockSize,
			borderColor: vars.color.border.control,
			borderRadius: vars.radius.full,
			borderStyle: 'solid',
			borderWidth: trackBorderWidth,
			boxShadow: vars.depth.recessed,
			boxSizing: 'border-box',
			display: 'inline-flex',
			flexShrink: 0,
			inlineSize: trackInlineSize,
			// Centres the track on the label's first line, whatever the inherited line height.
			marginBlock: `calc((${fallbackVar(textLineHeight, '1lh')} - ${trackBlockSize}) / 2)`,
			paddingInline: thumbInset,
			transitionDuration: vars.motion.duration.feedback,
			transitionProperty: 'background-color, background-image, border-color, box-shadow, opacity',
			transitionTimingFunction: vars.motion.easing.standard,
			selectors: {
				'[data-disabled="true"] &': {
					opacity: vars.interaction.disabledOpacity,
				},
				'[data-focus-visible="true"] &': focusRing(vars.color.border.focus),
				[`${hovered()}, ${pressed()}`]: {
					backgroundColor: vars.color.border.controlHover,
					borderColor: vars.color.border.controlHover,
				},
				'[data-invalid="true"] &': {
					borderColor: vars.color.background.danger.solid.rest,
				},
				[hovered('[data-invalid="true"]')]: {
					borderColor: vars.color.background.danger.solid.hover,
				},
				[pressed('[data-invalid="true"]')]: {
					borderColor: vars.color.background.danger.solid.pressed,
				},
				'[data-selected="true"] &': {
					backgroundColor: vars.color.background.accent.solid.rest,
					backgroundImage: vars.controlFinish.resting,
					borderColor: vars.color.background.accent.solid.rest,
					boxShadow: 'none',
				},
				[hovered('[data-selected="true"]')]: {
					backgroundColor: vars.color.background.accent.solid.hover,
					backgroundImage: vars.controlFinish.raised,
					borderColor: vars.color.background.accent.solid.hover,
				},
				[pressed('[data-selected="true"]')]: {
					backgroundColor: vars.color.background.accent.solid.pressed,
					backgroundImage: vars.controlFinish.recessed,
					borderColor: vars.color.background.accent.solid.pressed,
				},
				'[data-invalid="true"][data-selected="true"] &': {
					backgroundColor: vars.color.background.danger.solid.rest,
					borderColor: vars.color.background.danger.solid.rest,
				},
				[hovered('[data-invalid="true"][data-selected="true"]')]: {
					backgroundColor: vars.color.background.danger.solid.hover,
					borderColor: vars.color.background.danger.solid.hover,
				},
				[pressed('[data-invalid="true"][data-selected="true"]')]: {
					backgroundColor: vars.color.background.danger.solid.pressed,
					borderColor: vars.color.background.danger.solid.pressed,
				},
			},
		},
		thumb: {
			'@media': {
				'(forced-colors: active)': {
					backgroundColor: 'CanvasText',
					boxShadow: 'none',
					forcedColorAdjust: 'none',
					// The thumb opts out of forced colours to stay visible, so every state that sets an
					// author colour needs a system colour here. Disabled comes last.
					selectors: {
						'[data-invalid="true"] &': {
							backgroundColor: 'CanvasText',
						},
						[pressed(':not([data-selected="true"])')]: {
							backgroundColor: 'CanvasText',
						},
						'[data-selected="true"] &, [data-invalid="true"][data-selected="true"] &': {
							backgroundColor: 'HighlightText',
						},
						'[data-disabled="true"] &': {
							backgroundColor: 'GrayText',
						},
					},
				},
				'(prefers-reduced-motion: reduce)': {
					transition: 'none',
				},
			},
			alignItems: 'center',
			// Thumb contrast comes from the fills, never the shadow. `compileTheme` hard-gates each pair at
			// build time, so every shipped and extended theme clears it: the field thumb on the
			// `border.control` track at 3:1, and each `onSolid` thumb on its solid track at 4.5:1.
			backgroundColor: vars.color.surface.field,
			blockSize: thumbSize,
			boxShadow: vars.depth.resting,
			borderRadius: vars.radius.full,
			display: 'inline-flex',
			flexShrink: 0,
			inlineSize: thumbSize,
			justifyContent: 'center',
			marginInlineStart: 0,
			transitionDuration: vars.motion.duration.feedback,
			transitionProperty: 'background-color, margin-inline-start',
			transitionTimingFunction: vars.motion.easing.standard,
			selectors: {
				// The off thumb is the switch's field part, so it takes the neutral pressed fill, as an
				// unchecked Checkbox box does.
				[pressed(':not([data-selected="true"])')]: {
					backgroundColor: vars.color.background.neutral.subtle.pressed,
				},
				'[data-selected="true"] &': {
					backgroundColor: vars.color.foreground.accent.onSolid,
					marginInlineStart: thumbTravel,
				},
				'[data-invalid="true"][data-selected="true"] &': {
					backgroundColor: vars.color.foreground.danger.onSolid,
				},
			},
		},
	},
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: {
			large: { root: sizeVars(ICON_SIZES.medium) },
			medium: { root: sizeVars(ICON_SIZES.small) },
			small: { root: sizeVars(ICON_SIZES.xsmall) },
		},
	},
} as const satisfies SlottedConfigInput;

/**
 * Slotted recipe for the Switch primitive anatomy. It is private: its slots depend on the Switch
 * parts and their state attributes.
 */
export const switchRecipe = recipe(switchConfig);

/** Outer variant selection for the Switch recipe. */
export type SwitchRecipeVariants = RecipeSelection<typeof switchRecipe>;
