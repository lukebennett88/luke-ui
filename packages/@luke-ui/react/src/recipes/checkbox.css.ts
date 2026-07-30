import { createVar, fallbackVar } from '@vanilla-extract/css';
import { focusRing } from '../styles/focus-ring.js';
import { vars } from '../theme/contract.css.js';
import { fieldMessageIndent } from './field.css.js';
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
			color: vars.color.intent.accent.onSolid,
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
					borderColor: vars.color.intent.accent.border,
				},
				'[data-pressed="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &': {
					backgroundImage: vars.actionControlFinish.recessed,
					borderColor: vars.color.intent.accent.border,
				},
				'[data-indeterminate="true"] &': {
					backgroundColor: vars.color.intent.accent.surface.solid,
					borderColor: vars.color.intent.accent.surface.solid,
				},
				'[data-indeterminate="true"] &::after': {
					content: '"−"',
					opacity: 1,
				},
				'[data-invalid="true"] &': {
					borderColor: vars.color.intent.danger.border,
				},
				'[data-selected="true"] &': {
					backgroundColor: vars.color.intent.accent.surface.solid,
					borderColor: vars.color.intent.accent.surface.solid,
				},
				'[data-selected="true"] &::after': {
					opacity: 1,
				},
				'[data-selected="true"][data-hovered="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &, [data-indeterminate="true"][data-hovered="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &':
					{
						backgroundColor: vars.color.intent.accent.surface.solidHover,
						borderColor: vars.color.intent.accent.surface.solidHover,
					},
				'[data-selected="true"][data-pressed="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &, [data-indeterminate="true"][data-pressed="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &':
					{
						backgroundColor: vars.color.intent.accent.surface.solidPressed,
						borderColor: vars.color.intent.accent.surface.solidPressed,
					},
				'[data-invalid="true"][data-selected="true"] &, [data-invalid="true"][data-indeterminate="true"] &':
					{
						backgroundColor: vars.color.intent.danger.surface.solid,
						borderColor: vars.color.intent.danger.surface.solid,
						color: vars.color.intent.danger.onSolid,
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
