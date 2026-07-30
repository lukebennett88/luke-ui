import { createVar, fallbackVar } from '@vanilla-extract/css';
import { focusRing } from '../styles/focus-ring.js';
import { vars } from '../theme/contract.css.js';
import { fieldMessageIndent } from './field.css.js';
import { invalidIndicatorIcon, invalidIndicatorIconForcedColors } from './invalid-indicator.js';
import type { RecipeSelection, SlottedConfigInput } from './recipe.js';
import { recipe } from './recipe.js';
import { textLineHeight } from './text.css.js';

const checkboxControlSize = createVar();
const checkboxGlyphSize = createVar();
const checkboxIndicatorSize = createVar();

const checkboxConfig = {
	slots: {
		root: {
			display: 'flex',
			flexDirection: 'column',
			gap: vars.space[100],
			minInlineSize: 0,
		},
		content: {
			'@media': {
				'(forced-colors: active)': {
					forcedColorAdjust: 'auto',
					selectors: {
						'[data-invalid="true"] &::after': invalidIndicatorIconForcedColors,
					},
				},
			},
			alignItems: 'flex-start',
			color: 'inherit',
			cursor: 'pointer',
			display: 'inline-flex',
			font: 'inherit',
			gap: vars.space[200],
			minInlineSize: 0,
			selectors: {
				'&[data-disabled="true"]': {
					color: vars.color.text.disabled,
					cursor: 'not-allowed',
				},
				'&[data-readonly="true"]': {
					cursor: 'default',
				},
				// `content`'s siblings are `control` and the label text, both first-line
				// aligned via `blockSize: 1lh` (see `control` below), so the icon gets the
				// same override: without it the icon's own 16px box sits at `flex-start`
				// (`content`'s own alignment, chosen so a wrapping label reads top-down),
				// floating at the row's top edge instead of the first line.
				'[data-invalid="true"] &::after': {
					...invalidIndicatorIcon,
					blockSize: fallbackVar(textLineHeight, '1lh'),
				},
			},
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
			alignItems: 'center',
			backgroundColor: vars.color.surface.canvas,
			backgroundImage: vars.actionControlFinish.resting,
			blockSize: checkboxIndicatorSize,
			borderColor: vars.color.border.control,
			borderRadius: vars.radius.detail,
			borderStyle: 'solid',
			borderWidth: '1px',
			boxShadow: 'none',
			boxSizing: 'border-box',
			color: vars.color.foreground.accent.onSolid,
			display: 'inline-flex',
			fontSize: checkboxGlyphSize,
			fontWeight: vars.font.weight.heading,
			inlineSize: checkboxIndicatorSize,
			justifyContent: 'center',
			lineHeight: 1,
			outlineColor: 'transparent',
			outlineOffset: '2px',
			outlineStyle: 'solid',
			outlineWidth: '2px',
			transitionDuration: vars.motion.duration.fast,
			transitionProperty: 'background-color, background-image, border-color, color, opacity',
			transitionTimingFunction: vars.motion.easing.standard,
			selectors: {
				'&::after': {
					content: '"✓"',
					opacity: 0,
				},
				'[data-disabled="true"] &': {
					opacity: 0.55,
				},
				'[data-focus-visible="true"] &': focusRing(vars.color.border.focus),
				'[data-hovered="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &': {
					backgroundImage: vars.actionControlFinish.raised,
					borderColor: vars.color.border.accent,
				},
				'[data-pressed="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &': {
					backgroundImage: vars.actionControlFinish.recessed,
					borderColor: vars.color.border.accent,
				},
				'[data-indeterminate="true"] &': {
					backgroundColor: vars.color.background.accent.solid.rest,
					borderColor: vars.color.background.accent.solid.rest,
				},
				'[data-indeterminate="true"] &::after': {
					content: '"−"',
					opacity: 1,
				},
				'[data-invalid="true"] &': {
					borderColor: vars.color.background.danger.solid.rest,
					borderWidth: '2px',
				},
				'[data-selected="true"] &': {
					backgroundColor: vars.color.background.accent.solid.rest,
					borderColor: vars.color.background.accent.solid.rest,
				},
				'[data-selected="true"] &::after': {
					opacity: 1,
				},
				'[data-selected="true"][data-hovered="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &, [data-indeterminate="true"][data-hovered="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &':
					{
						backgroundColor: vars.color.background.accent.solid.hover,
						borderColor: vars.color.background.accent.solid.hover,
					},
				'[data-selected="true"][data-pressed="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &, [data-indeterminate="true"][data-pressed="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &':
					{
						backgroundColor: vars.color.background.accent.solid.pressed,
						borderColor: vars.color.background.accent.solid.pressed,
					},
				'[data-invalid="true"][data-selected="true"] &, [data-invalid="true"][data-indeterminate="true"] &':
					{
						backgroundColor: vars.color.background.danger.solid.rest,
						borderColor: vars.color.background.danger.solid.rest,
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
						[checkboxControlSize]: vars.font[500].lineHeight,
						[checkboxGlyphSize]: vars.iconSize.small,
						[checkboxIndicatorSize]: vars.iconSize.medium,
						[fieldMessageIndent]: `calc(${checkboxControlSize} + ${vars.space[200]})`,
					},
				},
			},
			medium: {
				root: {
					vars: {
						[checkboxControlSize]: vars.font[300].lineHeight,
						[checkboxGlyphSize]: vars.iconSize.xsmall,
						[checkboxIndicatorSize]: vars.iconSize.small,
						[fieldMessageIndent]: `calc(${checkboxControlSize} + ${vars.space[200]})`,
					},
				},
			},
			small: {
				root: {
					vars: {
						[checkboxControlSize]: vars.iconSize.small,
						[checkboxGlyphSize]: vars.font[100].fontSize,
						[checkboxIndicatorSize]: vars.iconSize.xsmall,
						[fieldMessageIndent]: `calc(${checkboxControlSize} + ${vars.space[200]})`,
					},
				},
			},
		},
	},
} as const satisfies SlottedConfigInput;

/** Slotted recipe for the Checkbox primitive anatomy. */
export const checkbox = recipe(checkboxConfig);

/** Outer variant selection for the Checkbox recipe. */
export type CheckboxVariants = RecipeSelection<typeof checkbox>;
