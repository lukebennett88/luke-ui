import { createVar, fallbackVar } from '@vanilla-extract/css';
import { focusRing, restingFocusRing } from '../../styles/focus-ring.js';
import type { RecipeSelection, SlottedConfigInput } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';
import { textLineHeight } from '../../text/recipe.css.js';
import { vars } from '../../theme/contract.css.js';
import { FONT_METRIC_SCALE } from '../../theme/font-metric-scale.js';
import { interactionColor } from '../../theme/interaction-color.js';
import { fieldMessageIcon, fieldMessageIndent } from '../field/recipe.css.js';

const checkboxControlSize = createVar();
const checkboxGlyphSize = createVar();
const checkboxIndicatorSize = createVar();

/** Shared guard excluding a disabled or read-only control from an interaction selector. */
const notDisabledOrReadOnly = ':not([data-disabled="true"]):not([data-readonly="true"])';

/**
 * Builds the indicator's hover/pressed selector list for one interaction state.
 * `stateAttrs` lists one `[data-*]` attribute clause per OR-ed alternative (an empty string for
 * the interaction alone, unqualified by selection), and `extraExclusion` adds any further
 * `:not(...)` clause specific to that state (for example, excluding the invalid selectors already
 * covered by their own, more specific rule).
 */
function interactionSelector(
	interaction: 'hovered' | 'pressed',
	stateAttrs: ReadonlyArray<string>,
	extraExclusion = '',
): string {
	const guard = `${notDisabledOrReadOnly}${extraExclusion}`;
	return stateAttrs.map((attrs) => `[data-${interaction}="true"]${attrs}${guard} &`).join(', ');
}

const checkboxConfig = {
	slots: {
		root: {
			display: 'flex',
			flexDirection: 'column',
			gap: vars.space[100],
			minInlineSize: 0,
			// Checkbox's own box has no room for an in-control invalid icon without it
			// floating past the label (see `indicator` below), so its icon renders on
			// the error message instead — `primitives/field/recipe.css.ts`'s `message` slot draws it,
			// gated behind this var, which stays off for every other consumer.
			vars: {
				[fieldMessageIcon]: 'inline-block',
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
				// The reset default ring would otherwise paint both this clickable row and the
				// indicator box; the box alone carries the focus indication (see `indicator`).
				'&[data-focus-visible="true"]': {
					outline: 'none',
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
			...restingFocusRing(),
			transitionDuration: vars.motion.duration.feedback,
			transitionProperty: 'background-color, background-image, border-color, color, opacity',
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
				[interactionSelector(
					'hovered',
					[''],
					':not([data-selected="true"]):not([data-indeterminate="true"])',
				)]: {
					backgroundColor: interactionColor(vars.color.surface.canvas, 'hover'),
					backgroundImage: vars.actionControlFinish.raised,
					borderColor: interactionColor(vars.color.border.control, 'hover'),
				},
				[interactionSelector(
					'pressed',
					[''],
					':not([data-selected="true"]):not([data-indeterminate="true"])',
				)]: {
					backgroundColor: interactionColor(vars.color.surface.canvas, 'pressed'),
					backgroundImage: vars.actionControlFinish.recessed,
				},
				'[data-indeterminate="true"] &': {
					backgroundColor: vars.color.background.accent.solid,
					borderColor: vars.color.background.accent.solid,
				},
				'[data-indeterminate="true"] &::after': {
					content: '"−"',
					opacity: 1,
				},
				'[data-invalid="true"] &': {
					borderColor: vars.color.background.danger.solid,
				},
				'[data-selected="true"] &': {
					backgroundColor: vars.color.background.accent.solid,
					borderColor: vars.color.background.accent.solid,
				},
				'[data-selected="true"] &::after': {
					opacity: 1,
				},
				[interactionSelector(
					'hovered',
					['[data-selected="true"]', '[data-indeterminate="true"]'],
					':not([data-invalid="true"])',
				)]: {
					backgroundColor: interactionColor(vars.color.background.accent.solid, 'hover'),
					backgroundImage: vars.actionControlFinish.raised,
					borderColor: interactionColor(vars.color.background.accent.solid, 'hover'),
				},
				[interactionSelector(
					'pressed',
					['[data-selected="true"]', '[data-indeterminate="true"]'],
					':not([data-invalid="true"])',
				)]: {
					backgroundColor: interactionColor(vars.color.background.accent.solid, 'pressed'),
					backgroundImage: vars.actionControlFinish.recessed,
				},
				'[data-invalid="true"][data-selected="true"] &, [data-invalid="true"][data-indeterminate="true"] &':
					{
						backgroundColor: vars.color.background.danger.solid,
						borderColor: vars.color.background.danger.solid,
						color: vars.color.foreground.danger.onSolid,
					},
				[interactionSelector('hovered', [
					'[data-invalid="true"][data-selected="true"]',
					'[data-invalid="true"][data-indeterminate="true"]',
				])]: {
					backgroundColor: interactionColor(vars.color.background.danger.solid, 'hover'),
					backgroundImage: vars.actionControlFinish.raised,
					borderColor: interactionColor(vars.color.background.danger.solid, 'hover'),
				},
				[interactionSelector('pressed', [
					'[data-invalid="true"][data-selected="true"]',
					'[data-invalid="true"][data-indeterminate="true"]',
				])]: {
					backgroundColor: interactionColor(vars.color.background.danger.solid, 'pressed'),
					backgroundImage: vars.actionControlFinish.recessed,
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
						[checkboxGlyphSize]: vars.iconSize.small,
						[checkboxIndicatorSize]: vars.iconSize.medium,
						[fieldMessageIndent]: `calc(${checkboxControlSize} + ${vars.space[200]})`,
					},
				},
			},
			medium: {
				root: {
					vars: {
						[checkboxControlSize]: FONT_METRIC_SCALE[16].lineHeight,
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
						[checkboxGlyphSize]: FONT_METRIC_SCALE[12].fontSize,
						[checkboxIndicatorSize]: vars.iconSize.xsmall,
						[fieldMessageIndent]: `calc(${checkboxControlSize} + ${vars.space[200]})`,
					},
				},
			},
		},
	},
} as const satisfies SlottedConfigInput;

/** Slotted recipe for the Checkbox primitive anatomy. */
export const checkboxRecipe = recipe(checkboxConfig);

/** Outer variant selection for the Checkbox recipe. */
export type CheckboxRecipeVariants = RecipeSelection<typeof checkboxRecipe>;
