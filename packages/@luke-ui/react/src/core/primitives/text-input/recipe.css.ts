import type { StyleRule } from '@vanilla-extract/css';
import { createVar, fallbackVar } from '@vanilla-extract/css';
import { vars } from '../../../theme/contract.css.js';
import { FONT_METRIC_SCALE } from '../../../theme/font-metric-scale.js';
import { focusRing } from '../../styles/focus-ring.js';
import {
	composeInputStateSelectors,
	descendantDisabledSelector,
} from '../../styles/input-states.js';
import type { RecipeSelection } from '../../styles/recipe-types.js';
import type { SlottedConfigInput } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';

/**
 * Resting inline padding of the input, set per `size`. The `input` slot sets it on itself, and
 * `control` sets it for the input inside it. A bare input shrinks it while its border thickens,
 * keeping the box and the text where they were.
 */
export const textInputInlinePadding = createVar();
const textInputInvalidPaddingAdjust = createVar();
const textInputInputPaddingInline = `calc(${textInputInlinePadding} - ${fallbackVar(textInputInvalidPaddingAdjust, '0px')})`;

/** Styles every text input shares, whether it draws its own chrome or sits inside a control. */
export const textInputInputBase = {
	appearance: 'none',
	backgroundColor: 'transparent',
	borderColor: 'transparent',
	borderStyle: 'none',
	borderWidth: 0,
	color: vars.color.text.primary,
	cursor: 'text',
	fontFamily: 'inherit',
	fontWeight: 'inherit',
	inlineSize: '100%',
	minInlineSize: 0,
	outlineColor: 'transparent',
	outlineStyle: 'none',
	outlineWidth: 0,
	paddingBlockEnd: 0,
	paddingBlockStart: 0,

	selectors: {
		'&::placeholder': {
			color: vars.color.text.secondary,
			opacity: 1,
		},
		'&:where([data-disabled="true"], :disabled)': {
			color: vars.color.text.disabled,
			cursor: 'not-allowed',
		},
	},
} as const satisfies StyleRule;

const control = composeInputStateSelectors();

// A bare `<input>` carries its own state: `:disabled` and `:read-only` match the element itself,
// where the defaults probe for a descendant input.
const input = composeInputStateSelectors({ disabled: ':disabled', readOnly: ':read-only' });

/**
 * Raw slotted config for the TextInput primitives.
 *
 * Slots: `root` (the `TextInputRoot` element), `control` (the `TextInputControl` well chrome),
 * `input` (an `<input>` that draws its own chrome), and `prefix` / `suffix` (the leading and
 * trailing parts). A `TextInput` inside a `TextInputControl` takes the private
 * `textInputInControlClassName` instead of `input`, so it sits transparent in the control.
 */
const textInputConfig = {
	slots: {
		root: {
			minInlineSize: 0,
		},
		control: {
			'@media': {
				'(forced-colors: active)': {
					backgroundColor: 'Field',
					borderColor: 'FieldText',
					boxShadow: 'none',
					color: 'FieldText',
					forcedColorAdjust: 'auto',
					selectors: {
						[control.disabled]: {
							borderColor: 'GrayText',
							color: 'GrayText',
							opacity: 1,
						},
						[control.focusWithin]: {
							outlineColor: 'Highlight',
						},
						[control.invalidFocusWithin]: {
							outlineColor: 'Highlight',
						},
					},
				},
			},
			alignItems: 'center',
			backgroundColor: vars.color.surface.recessed,
			borderColor: vars.color.border.control,
			borderRadius: vars.radius.control,
			borderStyle: 'solid',
			borderWidth: '1px',
			boxShadow: vars.depth.recessed,
			cursor: 'text',
			display: 'inline-flex',
			fontFamily: vars.font.family.body,
			inlineSize: '100%',
			isolation: 'isolate',
			letterSpacing: FONT_METRIC_SCALE[16].letterSpacing,
			lineHeight: FONT_METRIC_SCALE[16].lineHeight,
			minInlineSize: 0,
			overflow: 'visible',
			transitionDuration: vars.motion.duration.feedback,
			transitionProperty: 'background-color, border-color, color',
			transitionTimingFunction: vars.motion.easing.standard,

			selectors: {
				[control.disabled]: {
					cursor: 'not-allowed',
					opacity: vars.interaction.disabledOpacity,
				},
				[control.focusWithin]: {
					borderColor: vars.color.border.accent,
					...focusRing(vars.color.border.focus),
				},
				[control.hover]: {
					borderColor: vars.color.border.accent,
				},
				// The field's error message carries the non-colour invalid cue, so the border keeps
				// its resting width and only takes the danger colour.
				[control.invalid]: {
					borderColor: vars.color.background.danger.solid.rest,
				},
				[control.invalidFocusWithin]: {
					borderColor: vars.color.background.danger.solid.rest,
					...focusRing(vars.color.border.focus),
				},
				[control.readOnly]: {
					backgroundColor: vars.color.surface.canvas,
					borderColor: vars.color.border.decorative,
					boxShadow: 'none',
				},
				[control.readOnlyFocusWithin]: {
					...focusRing(vars.color.border.focus),
				},
			},
		},
		// An input outside a control draws the same well chrome as `control`. Its invalid cue is
		// structural, because it may stand alone with no error message: an inset danger ring
		// doubles the border without changing the box, so the input does not shift when it turns
		// invalid.
		input: {
			'@media': {
				'(forced-colors: active)': {
					backgroundColor: 'Field',
					borderColor: 'FieldText',
					boxShadow: 'none',
					color: 'FieldText',
					forcedColorAdjust: 'auto',
					selectors: {
						[input.disabled]: {
							borderColor: 'GrayText',
							color: 'GrayText',
							opacity: 1,
						},
						[input.focusWithin]: {
							outlineColor: 'Highlight',
						},
						// Forced colours drop `box-shadow`, so the invalid cue is a 2px border. The
						// inline padding gives back the extra pixel, so the box and the text do not
						// move, and `outline` stays free for the focus ring.
						[input.invalid]: {
							borderWidth: '2px',
							vars: { [textInputInvalidPaddingAdjust]: '1px' },
						},
					},
				},
			},
			...textInputInputBase,
			backgroundColor: vars.color.surface.recessed,
			borderColor: vars.color.border.control,
			borderRadius: vars.radius.control,
			borderStyle: 'solid',
			borderWidth: '1px',
			boxShadow: vars.depth.recessed,
			fontFamily: vars.font.family.body,
			transitionDuration: vars.motion.duration.feedback,
			transitionProperty: 'background-color, border-color, box-shadow, color',
			transitionTimingFunction: vars.motion.easing.standard,

			selectors: {
				...textInputInputBase.selectors,
				[input.disabled]: {
					opacity: vars.interaction.disabledOpacity,
				},
				[input.focusWithin]: {
					borderColor: vars.color.border.accent,
					...focusRing(vars.color.border.focus),
				},
				[input.hover]: {
					borderColor: vars.color.border.accent,
				},
				[input.readOnly]: {
					backgroundColor: vars.color.surface.canvas,
					borderColor: vars.color.border.decorative,
					boxShadow: 'none',
				},
				[input.readOnlyFocusWithin]: {
					...focusRing(vars.color.border.focus),
				},
				// After `readOnly`, so a read-only invalid input keeps its cue.
				[input.invalid]: {
					borderColor: vars.color.background.danger.solid.rest,
					boxShadow: `inset 0 0 0 1px ${vars.color.background.danger.solid.rest}`,
				},
				[input.invalidFocusWithin]: {
					...focusRing(vars.color.border.focus),
				},
			},
		},
		prefix: {
			alignItems: 'center',
			borderInlineEndColor: vars.color.border.control,
			borderInlineEndStyle: 'solid',
			borderInlineEndWidth: '1px',
			color: vars.color.text.secondary,
			display: 'inline-flex',
			flexShrink: 0,

			selectors: {
				[descendantDisabledSelector]: {
					color: vars.color.text.disabled,
				},
			},
		},
		suffix: {
			alignItems: 'center',
			borderInlineStartColor: vars.color.border.control,
			borderInlineStartStyle: 'solid',
			borderInlineStartWidth: '1px',
			color: vars.color.text.secondary,
			display: 'inline-flex',
			flexShrink: 0,

			selectors: {
				[descendantDisabledSelector]: {
					color: vars.color.text.disabled,
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
				control: {
					blockSize: vars.controlSize.medium,
					fontSize: FONT_METRIC_SCALE[16].fontSize,
					vars: { [textInputInlinePadding]: vars.space.sp12 },
				},
				input: {
					blockSize: vars.controlSize.medium,
					fontSize: FONT_METRIC_SCALE[16].fontSize,
					letterSpacing: FONT_METRIC_SCALE[16].letterSpacing,
					lineHeight: FONT_METRIC_SCALE[16].lineHeight,
					paddingInlineEnd: textInputInputPaddingInline,
					paddingInlineStart: textInputInputPaddingInline,
					vars: { [textInputInlinePadding]: vars.space.sp12 },
				},
				prefix: {
					lineHeight: FONT_METRIC_SCALE[16].lineHeight,
					paddingInlineEnd: vars.space.sp12,
					paddingInlineStart: vars.space.sp12,
				},
				suffix: {
					lineHeight: FONT_METRIC_SCALE[16].lineHeight,
					paddingInlineEnd: vars.space.sp12,
					paddingInlineStart: vars.space.sp12,
				},
			},
			small: {
				control: {
					blockSize: vars.controlSize.small,
					fontSize: FONT_METRIC_SCALE[14].fontSize,
					letterSpacing: FONT_METRIC_SCALE[14].letterSpacing,
					lineHeight: FONT_METRIC_SCALE[14].lineHeight,
					vars: { [textInputInlinePadding]: vars.space.sp8 },
				},
				input: {
					blockSize: vars.controlSize.small,
					fontSize: FONT_METRIC_SCALE[14].fontSize,
					letterSpacing: FONT_METRIC_SCALE[14].letterSpacing,
					lineHeight: FONT_METRIC_SCALE[14].lineHeight,
					paddingInlineEnd: textInputInputPaddingInline,
					paddingInlineStart: textInputInputPaddingInline,
					vars: { [textInputInlinePadding]: vars.space.sp8 },
				},
				prefix: {
					lineHeight: FONT_METRIC_SCALE[14].lineHeight,
					paddingInlineEnd: vars.space.sp8,
					paddingInlineStart: vars.space.sp8,
				},
				suffix: {
					lineHeight: FONT_METRIC_SCALE[14].lineHeight,
					paddingInlineEnd: vars.space.sp8,
					paddingInlineStart: vars.space.sp8,
				},
			},
		},
	},
} as const satisfies SlottedConfigInput;

/**
 * Slotted recipe for the TextInput primitives.
 *
 * `textInputRecipe({ size }).root() / .control() / .input() / .prefix() / .suffix()`.
 */
export const textInputRecipe = recipe(textInputConfig);

/** Outer variant selection for the `textInput` recipe. */
export type TextInputRecipeVariants = RecipeSelection<typeof textInputRecipe>;

/** Allowed `size` values for the TextInput primitives. */
export type TextInputSize = keyof typeof textInputConfig.variants.size;
