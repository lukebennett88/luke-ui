import { createVar, fallbackVar } from '@vanilla-extract/css';
import { vars } from '../../../theme/contract.css.js';
import { FONT_METRIC_SCALE } from '../../../theme/font-metric-scale.js';
import { interactionTintVarName } from '../../../theme/interaction-tint-vars.js';
import { ICON_SIZES } from '../../sizing/icon-sizing.js';
import { focusRing } from '../../styles/focus-ring.js';
import { INTERACTION_STATE_LAYER_PROPERTY } from '../../styles/interaction-state-layer.js';
import type { RecipeSelection } from '../../styles/recipe-types.js';
import type { SlottedConfigInput } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';
import { interactionStateLayer } from '../../styles/state-layer.css.js';
import { surfaceStyle } from '../../styles/surface.js';
import { textLineHeight } from '../../text/recipe.css.js';
import { inlineControlGap, inlineFieldIndent } from '../field/recipe.css.js';

const radioControlSize = createVar();
const radioIndicatorSize = createVar();

/**
 * The selected mark grows in from this scale. The mark is 8 to 10px across, so a start near 1
 * changes it by about a pixel and the selection reads as a fade. Half size is a clear grow that
 * still starts from a visible dot, not from nothing.
 */
const markEnterScale = 0.5;

// Disabled and read-only radios give no hover or press feedback.
const interactive = ':not([data-disabled="true"]):not([data-readonly="true"])';

/** Selects the indicator while the radio matches `state` and is hovered. */
function hovered(state = '') {
	return `${state}[data-hovered="true"]${interactive} &`;
}

/** Selects the indicator while the radio matches `state` and is pressed. */
function pressed(state = '') {
	return `${state}[data-pressed="true"]${interactive} &`;
}

/** Uses a restrained portion of the shared tint over the radio's small base surface. */
function radioStateLayer(state: 'hover' | 'pressed') {
	const strength = state === 'hover' ? 60 : 80;
	return {
		vars: {
			[interactionStateLayer]: `color-mix(in srgb, var(${interactionTintVarName(state)}) ${strength}%, transparent)`,
		},
	};
}

/** Every selected selector that sets an author colour on the indicator, with its hover and press forms. */
const selectedForcedSelectors = [
	'[data-selected="true"]',
	'[data-invalid="true"][data-selected="true"]',
]
	.flatMap((state) => [`${state} &`, hovered(state), pressed(state)])
	.join(', ');

const radioConfig = {
	slots: {
		group: {
			minInlineSize: 0,
		},
		root: {
			display: 'flex',
			flexDirection: 'column',
			gap: vars.space['4'],
			minInlineSize: 0,
		},
		control: {
			alignItems: 'center',
			blockSize: fallbackVar(textLineHeight, '1lh'),
			display: 'inline-flex',
			flexShrink: 0,
			inlineSize: radioControlSize,
			justifyContent: 'center',
		},
		indicator: {
			'@media': {
				'(forced-colors: active)': {
					backgroundColor: 'Canvas',
					backgroundImage: 'none',
					borderColor: 'CanvasText',
					forcedColorAdjust: 'auto',
					selectors: {
						'[data-focus-visible="true"] &': {
							outlineColor: 'Highlight',
						},
						// The fill rule repeats every selected state selector that sets an author colour, at
						// the same specificity, so hover, press, and invalid colours cannot show through.
						// Disabled comes last so a disabled radio reads as disabled whether it is selected or
						// not.
						[selectedForcedSelectors]: {
							backgroundColor: 'Highlight',
							backgroundImage: 'none',
							borderColor: 'Highlight',
							color: 'HighlightText',
						},
						'[data-disabled="true"] &, [data-disabled="true"][data-invalid="true"] &': {
							backgroundColor: 'Canvas',
							backgroundImage: 'none',
							borderColor: 'GrayText',
							color: 'GrayText',
							opacity: 1,
						},
					},
				},
				'(prefers-reduced-motion: reduce)': {
					transitionDuration: '0s',
				},
			},
			// Unselected, the circle is a field part; selected, a solid fill with the control finish.
			// Hover and pressed change colour, so they stay distinct without materials. Every fill pairs
			// with its foreground context, so the mark reads the fill's colour: on-solid once selected.
			alignItems: 'center',
			...surfaceStyle('surface.base'),
			backgroundImage: `linear-gradient(${interactionStateLayer}, ${interactionStateLayer})`,
			// The finish spans the border too. From the padding box it would tile into the border and
			// repeat its lit top along the bottom edge.
			backgroundOrigin: 'border-box',
			blockSize: radioIndicatorSize,
			borderColor: vars.color.border.control.rest,
			borderRadius: vars.radius.full,
			borderStyle: 'solid',
			borderWidth: '1px',
			boxSizing: 'border-box',
			display: 'inline-flex',
			inlineSize: radioIndicatorSize,
			justifyContent: 'center',
			transitionDuration: vars.motion.feedback.duration,
			// No `color`: the mark appears with its fill's colour, not fading from the unselected one.
			transitionProperty: `background-color, background-image, border-color, opacity, ${INTERACTION_STATE_LAYER_PROPERTY}`,
			transitionTimingFunction: vars.motion.feedback.easing,
			selectors: {
				'[data-disabled="true"] &': {
					opacity: vars.interaction.disabledOpacity,
				},
				'[data-focus-visible="true"] &': focusRing(vars.color.focus),
				[hovered()]: {
					...radioStateLayer('hover'),
					borderColor: vars.color.border.control.hover,
				},
				[pressed()]: {
					...radioStateLayer('pressed'),
					borderColor: vars.color.border.control.pressed,
				},
				'[data-invalid="true"] &': {
					borderColor: vars.color.border.danger.strong,
				},
				'[data-selected="true"] &': {
					...surfaceStyle('accent.solid.rest'),
					backgroundImage: vars.controlFinish.resting,
					borderColor: vars.color.background.accent.solid.rest,
				},
				[hovered('[data-selected="true"]')]: {
					...surfaceStyle('accent.solid.hover'),
					backgroundImage: vars.controlFinish.raised,
					borderColor: vars.color.background.accent.solid.hover,
				},
				[pressed('[data-selected="true"]')]: {
					...surfaceStyle('accent.solid.pressed'),
					backgroundImage: vars.controlFinish.recessed,
					borderColor: vars.color.background.accent.solid.pressed,
				},
				'[data-invalid="true"][data-selected="true"] &': {
					...surfaceStyle('danger.solid.rest'),
					borderColor: vars.color.border.danger.strong,
				},
				// `border.danger.strong` is the guaranteed 3:1 boundary, so an invalid radio keeps it
				// through hover and press. The fill carries the feedback instead.
				[hovered('[data-invalid="true"]')]: {
					...radioStateLayer('hover'),
					borderColor: vars.color.border.danger.strong,
				},
				[pressed('[data-invalid="true"]')]: {
					...radioStateLayer('pressed'),
					borderColor: vars.color.border.danger.strong,
				},
				[hovered('[data-invalid="true"][data-selected="true"]')]: {
					...surfaceStyle('danger.solid.hover'),
					borderColor: vars.color.border.danger.strong,
				},
				[pressed('[data-invalid="true"][data-selected="true"]')]: {
					...surfaceStyle('danger.solid.pressed'),
					borderColor: vars.color.border.danger.strong,
				},
			},
		},
		// The mark is always laid out and centred. Unselected it is transparent and slightly small;
		// selected it grows in. Only the selected state carries a transition, and a transition runs
		// with the destination state's properties, so selecting animates while deselecting hides at
		// once. That leaves one visible mark at a time, as Checkbox does. A transition, unlike
		// keyframes, retargets from wherever it is, so rapid changes stay interruptible.
		mark: {
			'@media': {
				'(forced-colors: active)': {
					selectors: {
						'[data-selected="true"] &': { backgroundColor: 'HighlightText' },
					},
				},
				// The mark appears with no growth. Colour feedback on the circle still transitions.
				'(prefers-reduced-motion: reduce)': {
					selectors: {
						'[data-selected="true"] &': { transitionDuration: '0s' },
					},
				},
			},
			backgroundColor: 'currentColor',
			blockSize: '50%',
			borderRadius: vars.radius.full,
			flexShrink: 0,
			inlineSize: '50%',
			opacity: 0,
			transform: `scale(${markEnterScale})`,
			selectors: {
				'[data-selected="true"] &': {
					opacity: 1,
					transform: 'scale(1)',
					transitionDuration: vars.motion.feedback.duration,
					transitionProperty: 'opacity, transform',
					transitionTimingFunction: vars.motion.feedback.easing,
				},
			},
		},
	},
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: {
			medium: {
				root: {
					vars: {
						[radioControlSize]: FONT_METRIC_SCALE[16].lineHeight,
						[radioIndicatorSize]: ICON_SIZES.px20,
						[inlineFieldIndent]: `calc(${radioControlSize} + ${inlineControlGap})`,
					},
				},
			},
			small: {
				root: {
					vars: {
						[radioControlSize]: ICON_SIZES.px20,
						[radioIndicatorSize]: ICON_SIZES.px16,
						[inlineFieldIndent]: `calc(${radioControlSize} + ${inlineControlGap})`,
					},
				},
			},
		},
	},
} as const satisfies SlottedConfigInput;

export const radioRecipe = recipe(radioConfig);
export type RadioRecipeVariants = RecipeSelection<typeof radioRecipe>;
