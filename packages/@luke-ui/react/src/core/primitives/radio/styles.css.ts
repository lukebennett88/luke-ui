import { vars } from '../../../theme/contract.css.js';
import type { RecipeSelection } from '../../styles/recipe-types.js';
import type { SlottedConfigInput } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';
import {
	choiceControl,
	choiceForcedColors,
	choiceIndicator,
	choiceIndicatorStates,
	choiceSizeVars,
	chosenForcedSelectors,
	hovered,
	pressed,
} from '../field/choice-control.css.js';

/**
 * The selected mark grows in from this scale. The mark is 8 to 10px across, so a start near 1
 * changes it by about a pixel and the selection reads as a fade. Half size is a clear grow that
 * still starts from a visible dot, not from nothing.
 */
const markEnterScale = 0.5;

const selectedForcedSelectors = chosenForcedSelectors('[data-selected="true"]');

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
		control: choiceControl,
		indicator: {
			'@media': {
				'(forced-colors: active)': {
					...choiceForcedColors.indicator,
					selectors: {
						'[data-focus-visible="true"] &': choiceForcedColors.focusVisible,
						// The fill rule repeats every selected state selector that sets an author colour, at
						// the same specificity, so hover, press, and invalid colours cannot show through.
						// Disabled comes last so a disabled radio reads as disabled whether it is selected or
						// not.
						[selectedForcedSelectors]: choiceForcedColors.chosen,
						[choiceForcedColors.disabledSelector]: choiceForcedColors.disabled,
					},
				},
				'(prefers-reduced-motion: reduce)': {
					transitionDuration: '0s',
				},
			},
			...choiceIndicator,
			borderRadius: vars.radius.full,
			boxSizing: 'border-box',
			selectors: {
				'[data-disabled="true"] &': choiceIndicatorStates.disabled,
				'[data-focus-visible="true"] &': choiceIndicatorStates.focusVisible,
				[hovered()]: choiceIndicatorStates.hover,
				[pressed()]: choiceIndicatorStates.pressed,
				'[data-invalid="true"] &': choiceIndicatorStates.invalid,
				'[data-selected="true"] &': choiceIndicatorStates.chosen,
				[hovered('[data-selected="true"]')]: choiceIndicatorStates.chosenHover,
				[pressed('[data-selected="true"]')]: choiceIndicatorStates.chosenPressed,
				'[data-invalid="true"][data-selected="true"] &': choiceIndicatorStates.invalidChosen,
				[hovered('[data-invalid="true"]')]: choiceIndicatorStates.invalidHover,
				[pressed('[data-invalid="true"]')]: choiceIndicatorStates.invalidPressed,
				[hovered('[data-invalid="true"][data-selected="true"]')]:
					choiceIndicatorStates.invalidChosenHover,
				[pressed('[data-invalid="true"][data-selected="true"]')]:
					choiceIndicatorStates.invalidChosenPressed,
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
					// Disabled comes last, as it does on the indicator, so a disabled dot is not
					// `HighlightText` on the indicator's `Canvas`.
					selectors: {
						'[data-selected="true"] &': { backgroundColor: 'HighlightText' },
						'[data-disabled="true"] &': { backgroundColor: 'GrayText' },
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
			medium: { root: { vars: choiceSizeVars.medium } },
			small: { root: { vars: choiceSizeVars.small } },
		},
	},
} as const satisfies SlottedConfigInput;

export const radioRecipe = recipe(radioConfig);
export type RadioRecipeVariants = RecipeSelection<typeof radioRecipe>;
