import { createVar, fallbackVar } from '@vanilla-extract/css';
import { vars } from '../../../theme/contract.css.js';
import { FONT_METRIC_SCALE } from '../../../theme/font-metric-scale.js';
import { ICON_SIZES } from '../../sizing/icon-sizing.js';
import { focusRing } from '../../styles/focus-ring.js';
import type { RecipeSelection } from '../../styles/recipe-types.js';
import type { SlottedConfigInput } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';
import { textLineHeight } from '../../text/recipe.css.js';
import { inlineControlGap, inlineFieldIndent } from '../field/recipe.css.js';

const checkboxControlSize = createVar();
const checkboxGlyphSize = createVar();
const checkboxIndicatorSize = createVar();

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
						'[data-disabled="true"] &': {
							borderColor: 'GrayText',
							color: 'GrayText',
							opacity: 1,
						},
						'[data-focus-visible="true"] &': {
							outlineColor: 'Highlight',
						},
						'[data-indeterminate="true"] &, [data-selected="true"] &': {
							backgroundColor: 'Highlight',
							borderColor: 'Highlight',
							color: 'HighlightText',
						},
					},
				},
				'(prefers-reduced-motion: reduce)': {
					transition: 'none',
				},
			},
			// Unchecked, the box is a field part: the field surface, the guaranteed control border, and
			// inset depth. Checked, it is a solid fill with the control finish. Hover and pressed
			// change colour, so they stay distinct when a theme sets every material to `none`.
			alignItems: 'center',
			backgroundColor: vars.color.surface.field,
			backgroundImage: 'none',
			// The finish spans the border too. From the padding box it would tile into the border and
			// repeat its lit top along the bottom edge.
			backgroundOrigin: 'border-box',
			blockSize: checkboxIndicatorSize,
			borderColor: vars.color.border.control,
			borderRadius: vars.radius.detail,
			borderStyle: 'solid',
			borderWidth: '1px',
			boxShadow: vars.depth.recessed,
			color: vars.color.foreground.accent.onSolid,
			display: 'inline-flex',
			fontSize: checkboxGlyphSize,
			fontWeight: vars.font.weight.heading,
			inlineSize: checkboxIndicatorSize,
			justifyContent: 'center',
			lineHeight: 1,
			transitionDuration: vars.motion.duration.feedback,
			transitionProperty:
				'background-color, background-image, border-color, box-shadow, color, opacity',
			transitionTimingFunction: vars.motion.easing.standard,
			selectors: {
				'&::after': {
					content: '"✓"',
					opacity: 0,
				},
				'[data-disabled="true"] &': {
					opacity: vars.interaction.disabledOpacity,
				},
				'[data-focus-visible="true"] &': focusRing(vars.color.border.focus),
				'[data-hovered="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &': {
					borderColor: vars.color.border.controlHover,
				},
				'[data-pressed="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &': {
					backgroundColor: vars.color.background.neutral.subtle.pressed,
					borderColor: vars.color.border.controlHover,
				},
				'[data-indeterminate="true"] &': {
					backgroundColor: vars.color.background.accent.solid.rest,
					backgroundImage: vars.controlFinish.resting,
					borderColor: vars.color.background.accent.solid.rest,
					boxShadow: 'none',
				},
				'[data-indeterminate="true"] &::after': {
					content: '"−"',
					opacity: 1,
				},
				'[data-invalid="true"] &': {
					borderColor: vars.color.background.danger.solid.rest,
				},
				'[data-selected="true"] &': {
					backgroundColor: vars.color.background.accent.solid.rest,
					backgroundImage: vars.controlFinish.resting,
					borderColor: vars.color.background.accent.solid.rest,
					boxShadow: 'none',
				},
				'[data-selected="true"] &::after': {
					opacity: 1,
				},
				'[data-selected="true"][data-hovered="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &, [data-indeterminate="true"][data-hovered="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &':
					{
						backgroundColor: vars.color.background.accent.solid.hover,
						backgroundImage: vars.controlFinish.raised,
						borderColor: vars.color.background.accent.solid.hover,
					},
				'[data-selected="true"][data-pressed="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &, [data-indeterminate="true"][data-pressed="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &':
					{
						backgroundColor: vars.color.background.accent.solid.pressed,
						backgroundImage: vars.controlFinish.recessed,
						borderColor: vars.color.background.accent.solid.pressed,
					},
				'[data-invalid="true"][data-selected="true"] &, [data-invalid="true"][data-indeterminate="true"] &':
					{
						backgroundColor: vars.color.background.danger.solid.rest,
						borderColor: vars.color.background.danger.solid.rest,
						color: vars.color.foreground.danger.onSolid,
					},
				'[data-invalid="true"][data-hovered="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &':
					{
						borderColor: vars.color.background.danger.solid.hover,
					},
				'[data-invalid="true"][data-pressed="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &':
					{
						borderColor: vars.color.background.danger.solid.pressed,
					},
				'[data-invalid="true"][data-selected="true"][data-hovered="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &, [data-invalid="true"][data-indeterminate="true"][data-hovered="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &':
					{
						backgroundColor: vars.color.background.danger.solid.hover,
						borderColor: vars.color.background.danger.solid.hover,
						color: vars.color.foreground.danger.onSolid,
					},
				'[data-invalid="true"][data-selected="true"][data-pressed="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &, [data-invalid="true"][data-indeterminate="true"][data-pressed="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &':
					{
						backgroundColor: vars.color.background.danger.solid.pressed,
						borderColor: vars.color.background.danger.solid.pressed,
						color: vars.color.foreground.danger.onSolid,
					},
			},
		},
	},
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: {
			large: {
				root: {
					vars: {
						[checkboxControlSize]: FONT_METRIC_SCALE[20].lineHeight,
						[checkboxGlyphSize]: ICON_SIZES.small,
						[checkboxIndicatorSize]: ICON_SIZES.medium,
						[inlineFieldIndent]: `calc(${checkboxControlSize} + ${inlineControlGap})`,
					},
				},
			},
			medium: {
				root: {
					vars: {
						[checkboxControlSize]: FONT_METRIC_SCALE[16].lineHeight,
						[checkboxGlyphSize]: ICON_SIZES.xsmall,
						[checkboxIndicatorSize]: ICON_SIZES.small,
						[inlineFieldIndent]: `calc(${checkboxControlSize} + ${inlineControlGap})`,
					},
				},
			},
			small: {
				root: {
					vars: {
						[checkboxControlSize]: ICON_SIZES.small,
						[checkboxGlyphSize]: FONT_METRIC_SCALE[12].fontSize,
						[checkboxIndicatorSize]: ICON_SIZES.xsmall,
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
