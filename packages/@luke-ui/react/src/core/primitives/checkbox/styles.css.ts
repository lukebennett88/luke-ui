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

const checkboxControlSize = createVar();
const checkboxGlyphSize = createVar();
const checkboxIndicatorSize = createVar();

// Disabled and read-only boxes give no hover or press feedback.
const interactive = ':not([data-disabled="true"]):not([data-readonly="true"])';

/** Selects the box while the checkbox matches `state` and is hovered. */
function hovered(state = '') {
	return `${state}[data-hovered="true"]${interactive} &`;
}

/** Selects the box while the checkbox matches `state` and is pressed. */
function pressed(state = '') {
	return `${state}[data-pressed="true"]${interactive} &`;
}

/** Uses a restrained portion of the shared tint over the Checkbox's small base surface. */
function checkboxStateLayer(state: 'hover' | 'pressed') {
	const strength = state === 'hover' ? 60 : 80;
	return {
		vars: {
			[interactionStateLayer]: `color-mix(in srgb, var(${interactionTintVarName(state)}) ${strength}%, transparent)`,
		},
	};
}

/**
 * Strokes a mark path that draws in while `drawn` matches and hides at once otherwise, so only the
 * current target is ever visible. `opacity` is not transitioned: a path that stops being the target
 * disappears on the same frame, whatever its offset. Its offset still eases back to undrawn while
 * hidden, so showing it again mid-way continues from where it is instead of snapping.
 */
function markPath(drawn: string) {
	return {
		'@media': {
			// The mark appears with no draw. Colour feedback elsewhere on the box still transitions.
			'(prefers-reduced-motion: reduce)': {
				transitionDuration: '0s',
			},
		},
		fill: 'none',
		opacity: 0,
		stroke: 'currentColor',
		strokeDasharray: '1 2',
		strokeDashoffset: 1,
		strokeLinecap: 'butt',
		strokeLinejoin: 'round',
		// 3 of 24 units keeps the stroke as heavy as the old 2 of 16.
		strokeWidth: 3,
		transitionDuration: vars.motion.feedback.duration,
		transitionProperty: 'stroke-dashoffset',
		transitionTimingFunction: vars.motion.feedback.easing,
		selectors: {
			[drawn]: {
				opacity: 1,
				strokeDashoffset: 0,
			},
		},
	} as const;
}

/** Every checked or indeterminate selector that sets an author colour on the box, with its hover and press forms. */
const checkedForcedSelectors = ['[data-selected="true"]', '[data-indeterminate="true"]']
	.flatMap((state) => [state, `[data-invalid="true"]${state}`])
	.flatMap((state) => [`${state} &`, hovered(state), pressed(state)])
	.join(', ');

const checkboxConfig = {
	slots: {
		root: {
			minInlineSize: 0,
		},
		control: {
			alignItems: 'center',
			blockSize: fallbackVar(textLineHeight, '1lh'),
			display: 'inline-flex',
			flexShrink: 0,
			inlineSize: checkboxControlSize,
			justifyContent: 'center',
		},
		indicator: {
			'@media': {
				'(forced-colors: active)': {
					backgroundColor: 'Canvas',
					backgroundImage: 'none',
					borderColor: 'CanvasText',
					color: 'CanvasText',
					forcedColorAdjust: 'auto',
					selectors: {
						'[data-focus-visible="true"] &': {
							outlineColor: 'Highlight',
						},
						// The mark is an SVG stroked with `currentColor`, so it paints no text backplate and
						// follows `color`. The fill rule repeats every checked state selector that sets an
						// author colour, at the same specificity, so hover, press, and invalid colours cannot
						// show through. Disabled comes last so a disabled box reads as disabled whether it is
						// checked or not.
						[checkedForcedSelectors]: {
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
			},
			// Unchecked, the box is a field part; checked, a solid fill with the control finish. Hover
			// and pressed change colour, so they stay distinct without materials. Every fill pairs with
			// its foreground context, so the mark reads the fill's primary: on-solid colour once checked.
			alignItems: 'center',
			...surfaceStyle('surface.base'),
			backgroundImage: `linear-gradient(${interactionStateLayer}, ${interactionStateLayer})`,
			// The finish spans the border too. From the padding box it would tile into the border and
			// repeat its lit top along the bottom edge.
			backgroundOrigin: 'border-box',
			blockSize: checkboxIndicatorSize,
			borderColor: vars.color.border.control.rest,
			borderRadius: vars.radius.detail,
			borderStyle: 'solid',
			borderWidth: '1px',
			display: 'inline-flex',
			inlineSize: checkboxIndicatorSize,
			justifyContent: 'center',
			transitionDuration: vars.motion.feedback.duration,
			// No `color`: the mark appears with its fill's colour, not fading from the unchecked one.
			transitionProperty: `background-color, background-image, border-color, opacity, ${INTERACTION_STATE_LAYER_PROPERTY}`,
			transitionTimingFunction: vars.motion.feedback.easing,
			selectors: {
				'[data-disabled="true"] &': {
					opacity: vars.interaction.disabledOpacity,
				},
				'[data-focus-visible="true"] &': focusRing(vars.color.focus),
				[hovered()]: {
					...checkboxStateLayer('hover'),
					borderColor: vars.color.border.control.hover,
				},
				[pressed()]: {
					...checkboxStateLayer('pressed'),
					borderColor: vars.color.border.control.pressed,
				},
				'[data-indeterminate="true"] &': {
					...surfaceStyle('accent.solid.rest'),
					backgroundImage: vars.controlFinish.resting,
					borderColor: vars.color.background.accent.solid.rest,
				},
				'[data-invalid="true"] &': {
					borderColor: vars.color.border.danger.strong,
				},
				'[data-selected="true"] &': {
					...surfaceStyle('accent.solid.rest'),
					backgroundImage: vars.controlFinish.resting,
					borderColor: vars.color.background.accent.solid.rest,
				},
				[`${hovered('[data-selected="true"]')}, ${hovered('[data-indeterminate="true"]')}`]: {
					...surfaceStyle('accent.solid.hover'),
					backgroundImage: vars.controlFinish.raised,
					borderColor: vars.color.background.accent.solid.hover,
				},
				[`${pressed('[data-selected="true"]')}, ${pressed('[data-indeterminate="true"]')}`]: {
					...surfaceStyle('accent.solid.pressed'),
					backgroundImage: vars.controlFinish.recessed,
					borderColor: vars.color.background.accent.solid.pressed,
				},
				'[data-invalid="true"][data-selected="true"] &, [data-invalid="true"][data-indeterminate="true"] &':
					{
						...surfaceStyle('danger.solid.rest'),
						borderColor: vars.color.border.danger.strong,
					},
				// `border.danger.strong` is the guaranteed 3:1 boundary, so an invalid box keeps it through
				// hover and press. The fill carries the feedback instead.
				[hovered('[data-invalid="true"]')]: {
					...checkboxStateLayer('hover'),
					borderColor: vars.color.border.danger.strong,
				},
				[pressed('[data-invalid="true"]')]: {
					...checkboxStateLayer('pressed'),
					borderColor: vars.color.border.danger.strong,
				},
				[`${hovered('[data-invalid="true"][data-selected="true"]')}, ${hovered('[data-invalid="true"][data-indeterminate="true"]')}`]:
					{
						...surfaceStyle('danger.solid.hover'),
						borderColor: vars.color.border.danger.strong,
					},
				[`${pressed('[data-invalid="true"][data-selected="true"]')}, ${pressed('[data-invalid="true"][data-indeterminate="true"]')}`]:
					{
						...surfaceStyle('danger.solid.pressed'),
						borderColor: vars.color.border.danger.strong,
					},
			},
		},
		// The mark is an SVG drawn by `stroke-dashoffset`. Each path has `pathLength="1"`, so a dash
		// of 1 with an offset of 1 is fully undrawn and 0 is fully drawn. A butt cap leaves nothing
		// visible at zero length. A CSS transition, unlike keyframes, reverses from wherever it is
		// when the state flips, so rapid toggles stay interruptible.
		mark: {
			blockSize: checkboxGlyphSize,
			flexShrink: 0,
			inlineSize: checkboxGlyphSize,
			overflow: 'visible',
		},
		markCheck: markPath('[data-selected="true"]:not([data-indeterminate="true"]) &'),
		markDash: markPath('[data-indeterminate="true"] &'),
	},
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: {
			medium: {
				root: {
					vars: {
						[checkboxControlSize]: FONT_METRIC_SCALE[16].lineHeight,
						[checkboxGlyphSize]: ICON_SIZES.px16,
						[checkboxIndicatorSize]: ICON_SIZES.px20,
						[inlineFieldIndent]: `calc(${checkboxControlSize} + ${inlineControlGap})`,
					},
				},
			},
			small: {
				root: {
					vars: {
						[checkboxControlSize]: ICON_SIZES.px20,
						[checkboxGlyphSize]: FONT_METRIC_SCALE[12].fontSize,
						[checkboxIndicatorSize]: ICON_SIZES.px16,
						[inlineFieldIndent]: `calc(${checkboxControlSize} + ${inlineControlGap})`,
					},
				},
			},
		},
	},
} as const satisfies SlottedConfigInput;

/**
 * Slotted recipe for the Checkbox primitive anatomy. It is private: its slots depend on the
 * Checkbox parts and their state attributes.
 */
export const checkboxRecipe = recipe(checkboxConfig);

/** Outer variant selection for the Checkbox recipe. */
export type CheckboxRecipeVariants = RecipeSelection<typeof checkboxRecipe>;
