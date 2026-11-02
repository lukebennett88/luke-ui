import { vars } from '../../../theme/contract.css.js';
import { ICON_SIZES } from '../../sizing/icon-sizing.js';
import { focusRing } from '../../styles/focus-ring.js';
import type { RecipeSelection } from '../../styles/recipe-types.js';
import type { SlottedConfigInput } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';

const radioSize = {
	medium: ICON_SIZES.px20,
	small: ICON_SIZES.px16,
} as const;

const radioConfig = {
	slots: {
		group: {
			minInlineSize: 0,
		},
		root: {
			display: 'grid',
			gridTemplateColumns: 'max-content minmax(0, 1fr)',
			minInlineSize: 0,
			rowGap: vars.space['4'],
		},
		label: { gridColumn: '1 / -1' },
		control: {
			alignItems: 'center',
			blockSize: `max(1lh, ${radioSize.medium})`,
			display: 'inline-flex',
			flexShrink: 0,
			inlineSize: radioSize.medium,
			justifyContent: 'center',
			marginBlock: `calc((1lh - ${radioSize.medium}) / 2)`,
		},
		indicator: {
			'@media': {
				'(forced-colors: active)': {
					backgroundColor: 'Canvas',
					borderColor: 'CanvasText',
					forcedColorAdjust: 'auto',
					selectors: {
						'[data-focus-visible="true"] &': {
							outlineColor: 'Highlight',
						},
						'[data-selected="true"] &, [data-invalid="true"][data-selected="true"] &': {
							backgroundColor: 'Highlight',
							borderColor: 'Highlight',
							color: 'HighlightText',
						},
						'[data-disabled="true"] &': {
							backgroundColor: 'Canvas',
							borderColor: 'GrayText',
							color: 'GrayText',
						},
					},
				},
				'(prefers-reduced-motion: reduce)': {
					transitionDuration: '0s',
				},
			},
			backgroundColor: vars.color.background.surface.base,
			blockSize: radioSize.medium,
			borderColor: vars.color.border.control.rest,
			borderRadius: vars.radius.full,
			borderStyle: 'solid',
			borderWidth: '1px',
			boxSizing: 'border-box',
			display: 'inline-flex',
			inlineSize: radioSize.medium,
			justifyContent: 'center',
			transitionDuration: vars.motion.feedback.duration,
			transitionProperty: 'background-color, border-color, opacity',
			transitionTimingFunction: vars.motion.feedback.easing,
			selectors: {
				'[data-disabled="true"] &': {
					opacity: vars.interaction.disabledOpacity,
				},
				'[data-focus-visible="true"] &': focusRing(vars.color.focus),
				'[data-hovered="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &': {
					borderColor: vars.color.border.control.hover,
				},
				'[data-invalid="true"] &': {
					borderColor: vars.color.border.danger.strong,
				},
				'[data-selected="true"] &': {
					backgroundColor: vars.color.background.accent.solid.rest,
					color: vars.color.foreground.accent.onSolid,
					borderColor: vars.color.background.accent.solid.rest,
				},
				'[data-selected="true"][data-hovered="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &':
					{
						backgroundColor: vars.color.background.accent.solid.hover,
						color: vars.color.foreground.accent.onSolid,
						borderColor: vars.color.background.accent.solid.hover,
					},
				'[data-invalid="true"][data-selected="true"] &': {
					backgroundColor: vars.color.background.danger.solid.rest,
					color: vars.color.foreground.danger.onSolid,
					borderColor: vars.color.border.danger.strong,
				},
				'[data-invalid="true"][data-selected="true"][data-hovered="true"]:not([data-disabled="true"]):not([data-readonly="true"]) &':
					{
						backgroundColor: vars.color.background.danger.solid.hover,
						color: vars.color.foreground.danger.onSolid,
						borderColor: vars.color.border.danger.strong,
					},
			},
		},
		mark: {
			backgroundColor: 'currentColor',
			blockSize: '50%',
			borderRadius: vars.radius.full,
			display: 'none',
			inlineSize: '50%',
			'@media': {
				'(forced-colors: active)': {
					selectors: {
						'[data-selected="true"] &': { backgroundColor: 'HighlightText' },
					},
				},
			},
			selectors: {
				'[data-selected="true"] &': { display: 'block' },
			},
		},
		description: {
			gridColumn: '2',
		},
	},
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: {
			medium: {
				control: {
					blockSize: `max(1lh, ${radioSize.medium})`,
					inlineSize: radioSize.medium,
					marginBlock: `calc((1lh - ${radioSize.medium}) / 2)`,
				},
				indicator: { blockSize: radioSize.medium, inlineSize: radioSize.medium },
			},
			small: {
				control: {
					blockSize: `max(1lh, ${radioSize.small})`,
					inlineSize: radioSize.small,
					marginBlock: `calc((1lh - ${radioSize.small}) / 2)`,
				},
				indicator: { blockSize: radioSize.small, inlineSize: radioSize.small },
			},
		},
	},
} as const satisfies SlottedConfigInput;

export const radioRecipe = recipe(radioConfig);
export type RadioRecipeVariants = RecipeSelection<typeof radioRecipe>;
