import { createVar, fallbackVar } from '@vanilla-extract/css';
import { focusRing } from '../styles/focus-ring.js';
import { vars } from '../theme/contract.css.js';
import { fieldMessageIcon, fieldMessageIconOffset, fieldMessageIndent } from './field.css.js';
import { invalidMessageIconOffset } from './invalid-indicator.js';
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
			// Checkbox's own box has no room for an in-control invalid icon without it
			// floating past the label (see `indicator` below), so its icon renders on
			// the error message instead — `field.css.ts`'s `message` slot draws it,
			// gated behind these vars, which stay off for every other consumer.
			vars: {
				[fieldMessageIcon]: 'inline-block',
				[fieldMessageIconOffset]: invalidMessageIconOffset,
			},
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
				// Unlike `TextInput`/`Combobox` (which dropped their invalid border back to
				// 1px once their in-control icon became the non-colour cue), the box keeps
				// `borderWidth: '2px'` here. The reference systems this direction is drawn
				// from accept a colour-only invalid checkbox when there is no message
				// (Astryx: "no message = no icon, no visible cue at all beyond
				// aria-invalid"). We deliberately do not, because `errorMessage` is optional
				// on `composeField` and issue #247 exists precisely to fix that colour-only
				// case. The icon moved to the message (see `root`'s `fieldMessageIcon` var
				// above), so this 2px boundary is now the box's own always-present
				// non-colour cue — a deliberate divergence from the references, not an
				// oversight.
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
