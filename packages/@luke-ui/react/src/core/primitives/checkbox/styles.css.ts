import { createVar } from '@vanilla-extract/css';
import { vars } from '../../../theme/contract.css.js';
import { FONT_METRIC_SCALE } from '../../../theme/font-metric-scale.js';
import { ICON_SIZES } from '../../sizing/icon-sizing.js';
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

const checkboxGlyphSize = createVar();

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

const checkedForcedSelectors = chosenForcedSelectors(
	'[data-selected="true"]',
	'[data-indeterminate="true"]',
);

const checkboxConfig = {
	slots: {
		root: {
			minInlineSize: 0,
		},
		control: choiceControl,
		indicator: {
			'@media': {
				'(forced-colors: active)': {
					...choiceForcedColors.indicator,
					color: 'CanvasText',
					selectors: {
						'[data-focus-visible="true"] &': choiceForcedColors.focusVisible,
						// The mark is an SVG stroked with `currentColor`, so it paints no text backplate and
						// follows `color`. The fill rule repeats every checked state selector that sets an
						// author colour, at the same specificity, so hover, press, and invalid colours cannot
						// show through. Disabled comes last so a disabled box reads as disabled whether it is
						// checked or not.
						[checkedForcedSelectors]: choiceForcedColors.chosen,
						[choiceForcedColors.disabledSelector]: choiceForcedColors.disabled,
					},
				},
			},
			...choiceIndicator,
			borderRadius: vars.radius.detail,
			selectors: {
				'[data-disabled="true"] &': choiceIndicatorStates.disabled,
				'[data-focus-visible="true"] &': choiceIndicatorStates.focusVisible,
				[hovered()]: choiceIndicatorStates.hover,
				[pressed()]: choiceIndicatorStates.pressed,
				'[data-indeterminate="true"] &': choiceIndicatorStates.chosen,
				'[data-invalid="true"] &': choiceIndicatorStates.invalid,
				'[data-selected="true"] &': choiceIndicatorStates.chosen,
				[`${hovered('[data-selected="true"]')}, ${hovered('[data-indeterminate="true"]')}`]:
					choiceIndicatorStates.chosenHover,
				[`${pressed('[data-selected="true"]')}, ${pressed('[data-indeterminate="true"]')}`]:
					choiceIndicatorStates.chosenPressed,
				'[data-invalid="true"][data-selected="true"] &, [data-invalid="true"][data-indeterminate="true"] &':
					choiceIndicatorStates.invalidChosen,
				[hovered('[data-invalid="true"]')]: choiceIndicatorStates.invalidHover,
				[pressed('[data-invalid="true"]')]: choiceIndicatorStates.invalidPressed,
				[`${hovered('[data-invalid="true"][data-selected="true"]')}, ${hovered('[data-invalid="true"][data-indeterminate="true"]')}`]:
					choiceIndicatorStates.invalidChosenHover,
				[`${pressed('[data-invalid="true"][data-selected="true"]')}, ${pressed('[data-invalid="true"][data-indeterminate="true"]')}`]:
					choiceIndicatorStates.invalidChosenPressed,
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
				root: { vars: { ...choiceSizeVars.medium, [checkboxGlyphSize]: ICON_SIZES.px16 } },
			},
			small: {
				root: {
					vars: { ...choiceSizeVars.small, [checkboxGlyphSize]: FONT_METRIC_SCALE[12].fontSize },
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
