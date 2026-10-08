import { createVar, fallbackVar } from '@vanilla-extract/css';
import { vars } from '../../../theme/contract.css.js';
import { focusRing } from '../../styles/focus-ring.js';
import type { RecipeSelection } from '../../styles/recipe-types.js';
import type { SlottedConfigInput } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';
import { textLineHeight } from '../../text/recipe.css.js';
import { inlineControlGap, inlineFieldIndent } from '../field/recipe.css.js';

const trackBlockSize = createVar();
const trackInlineSize = createVar();

const trackBorderWidth = '1px';
const thumbInset = '2px';

/** Space between the thumb and the track's inner edge, including the border. */
const thumbOffset = `calc(${trackBorderWidth} + ${thumbInset})`;
const thumbSize = `calc(${trackBlockSize} - 2 * ${thumbOffset})`;
/** How far the thumb moves along the track when the switch is on. */
const thumbTravel = `calc(${trackInlineSize} - ${trackBlockSize})`;

// React Aria drops hover while the switch is disabled or read-only, and press while it is disabled,
// so only press needs a read-only guard.
const hovered = '[data-hovered="true"]';
const pressed = '[data-pressed="true"]:not([data-readonly="true"])';

/** Selects the track while the switch matches `state` and is hovered or pressed. */
function active(state: string) {
	return `${state}${hovered} &, ${state}${pressed} &`;
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
			alignItems: 'center',
			backgroundColor: vars.color.surface.canvas,
			blockSize: trackBlockSize,
			borderColor: vars.color.border.control,
			borderRadius: vars.radius.full,
			borderStyle: 'solid',
			borderWidth: trackBorderWidth,
			boxSizing: 'border-box',
			display: 'inline-flex',
			flexShrink: 0,
			inlineSize: trackInlineSize,
			// Centres the track on the label's first line, whatever the inherited line height.
			marginBlock: `calc((${fallbackVar(textLineHeight, '1lh')} - ${trackBlockSize}) / 2)`,
			paddingInline: thumbInset,
			transitionDuration: vars.motion.duration.feedback,
			transitionProperty: 'background-color, border-color, opacity',
			transitionTimingFunction: vars.motion.easing.standard,
			selectors: {
				'[data-disabled="true"] &': {
					opacity: vars.interaction.disabledOpacity,
				},
				'[data-focus-visible="true"] &': focusRing(vars.color.border.focus),
				[active('')]: {
					borderColor: vars.color.border.accent,
				},
				'[data-invalid="true"] &': {
					borderColor: vars.color.background.danger.solid.rest,
				},
				'[data-selected="true"] &': {
					backgroundColor: vars.color.background.accent.solid.rest,
					borderColor: vars.color.background.accent.solid.rest,
				},
				[active('[data-selected="true"]')]: {
					backgroundColor: vars.color.background.accent.solid.hover,
					borderColor: vars.color.background.accent.solid.hover,
				},
				[active('[data-invalid="true"]')]: {
					borderColor: vars.color.background.danger.solid.hover,
				},
				'[data-invalid="true"][data-selected="true"] &': {
					backgroundColor: vars.color.background.danger.solid.rest,
					borderColor: vars.color.background.danger.solid.rest,
				},
				[active('[data-invalid="true"][data-selected="true"]')]: {
					backgroundColor: vars.color.background.danger.solid.hover,
					borderColor: vars.color.background.danger.solid.hover,
				},
			},
		},
		thumb: {
			'@media': {
				'(forced-colors: active)': {
					backgroundColor: 'CanvasText',
					forcedColorAdjust: 'none',
					// The thumb opts out of forced colours to stay visible, so every state that sets an
					// author colour needs a system colour here. Disabled comes last.
					selectors: {
						'[data-invalid="true"] &': {
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
			backgroundColor: vars.color.border.control,
			blockSize: thumbSize,
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
				'[data-invalid="true"] &': {
					backgroundColor: vars.color.background.danger.solid.rest,
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
			large: { root: sizeVars(vars.iconSize.medium) },
			medium: { root: sizeVars(vars.iconSize.small) },
			small: { root: sizeVars(vars.iconSize.xsmall) },
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
