import { createVar, fallbackVar } from '@vanilla-extract/css';
import { vars } from '../../../theme/contract.css.js';
import { FONT_METRIC_SCALE } from '../../../theme/font-metric-scale.js';
import { interactionTintVarName } from '../../../theme/interaction-tint-vars.js';
import { ICON_SIZES } from '../../sizing/icon-sizing.js';
import { controlBorderState } from '../../styles/control-border.js';
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
					position: 'relative',
					// Disabled comes last so a disabled box reads as disabled whether it is checked or not.
					selectors: {
						'[data-focus-visible="true"] &': {
							outlineColor: 'Highlight',
						},
						'[data-indeterminate="true"] &, [data-selected="true"] &': {
							backgroundColor: 'Highlight',
							borderColor: 'Highlight',
							color: 'HighlightText',
						},
						// The glyph is text, so a forced-colours backplate would paint `Canvas` over the
						// fill and hide the mark. It opts out and draws the fill itself, so hover, press,
						// and invalid colours on the box cannot show through either.
						'[data-indeterminate="true"] &::after, [data-selected="true"] &::after': {
							alignItems: 'center',
							backgroundColor: 'Highlight',
							borderRadius: 'inherit',
							color: 'HighlightText',
							display: 'flex',
							forcedColorAdjust: 'none',
							inset: 0,
							justifyContent: 'center',
							position: 'absolute',
						},
						// The invalid form matches the invalid checked rule's specificity, so that rule's
						// border cannot outrank this one. Forced colours come later in the stylesheet.
						'[data-disabled="true"] &, [data-disabled="true"][data-invalid="true"] &': {
							borderColor: 'GrayText',
							color: 'GrayText',
							opacity: 1,
						},
						'[data-disabled="true"] &::after': {
							backgroundColor: 'Canvas',
							color: 'GrayText',
						},
					},
				},
			},
			// Unchecked, the box is a field part; checked, a solid fill with the control finish. Hover
			// and pressed change colour, so they stay distinct without materials. Every fill pairs with
			// its foreground context, so the glyph reads the fill's primary: on-solid colour once checked.
			alignItems: 'center',
			...surfaceStyle('surface.base'),
			backgroundImage: `linear-gradient(${interactionStateLayer}, ${interactionStateLayer})`,
			// The finish spans the border too. From the padding box it would tile into the border and
			// repeat its lit top along the bottom edge.
			backgroundOrigin: 'border-box',
			blockSize: checkboxIndicatorSize,
			borderColor: vars.color.border.control,
			borderRadius: vars.radius.detail,
			borderStyle: 'solid',
			borderWidth: '1px',
			boxShadow: vars.shadow.inset,
			display: 'inline-flex',
			fontSize: checkboxGlyphSize,
			fontWeight: vars.font.weight.heading,
			inlineSize: checkboxIndicatorSize,
			justifyContent: 'center',
			lineHeight: 1,
			transitionDuration: vars.motion.feedback.duration,
			// No `color`: the glyph appears with its fill's colour, not fading from the unchecked one.
			transitionProperty: `background-color, background-image, border-color, box-shadow, opacity, ${INTERACTION_STATE_LAYER_PROPERTY}`,
			transitionTimingFunction: vars.motion.feedback.easing,
			selectors: {
				'&::after': {
					content: '"✓"',
					opacity: 0,
				},
				'[data-disabled="true"] &': {
					opacity: vars.interaction.disabledOpacity,
				},
				'[data-focus-visible="true"] &': focusRing(vars.color.border.focus),
				[hovered()]: {
					...checkboxStateLayer('hover'),
					borderColor: controlBorderState('hover'),
				},
				[pressed()]: {
					...checkboxStateLayer('pressed'),
					borderColor: controlBorderState('pressed'),
				},
				'[data-indeterminate="true"] &': {
					...surfaceStyle('accent.solid.rest'),
					backgroundImage: vars.controlFinish.resting,
					borderColor: vars.color.background.accent.solid.rest,
					boxShadow: 'none',
				},
				'[data-indeterminate="true"] &::after': {
					content: '"−"',
					opacity: 1,
				},
				'[data-invalid="true"] &': {
					borderColor: vars.color.border.danger,
				},
				'[data-selected="true"] &': {
					...surfaceStyle('accent.solid.rest'),
					backgroundImage: vars.controlFinish.resting,
					borderColor: vars.color.background.accent.solid.rest,
					boxShadow: 'none',
				},
				'[data-selected="true"] &::after': {
					opacity: 1,
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
						borderColor: vars.color.border.danger,
					},
				// `border.danger` is the guaranteed 3:1 boundary, so an invalid box keeps it through
				// hover and press. The fill carries the feedback instead.
				[hovered('[data-invalid="true"]')]: {
					...checkboxStateLayer('hover'),
					borderColor: vars.color.border.danger,
				},
				[pressed('[data-invalid="true"]')]: {
					...checkboxStateLayer('pressed'),
					borderColor: vars.color.border.danger,
				},
				[`${hovered('[data-invalid="true"][data-selected="true"]')}, ${hovered('[data-invalid="true"][data-indeterminate="true"]')}`]:
					{
						...surfaceStyle('danger.solid.hover'),
						borderColor: vars.color.border.danger,
					},
				[`${pressed('[data-invalid="true"][data-selected="true"]')}, ${pressed('[data-invalid="true"][data-indeterminate="true"]')}`]:
					{
						...surfaceStyle('danger.solid.pressed'),
						borderColor: vars.color.border.danger,
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
