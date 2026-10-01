import { createVar, fallbackVar } from '@vanilla-extract/css';
import { vars } from '../../../theme/contract.css.js';
import { FONT_METRIC_SCALE } from '../../../theme/font-metric-scale.js';
import { FIELD_CONTROL_ICON_SIZE } from '../../sizing/control-size.js';
import { classSelector } from '../../styles/class-selector.js';
import { focusRing } from '../../styles/focus-ring.js';
import {
	composeInputStateSelectors,
	descendantDisabledSelector,
} from '../../styles/input-states.js';
import {
	invalidIndicatorIcon,
	invalidIndicatorIconForcedColors,
} from '../../styles/invalid-indicator.js';
import type { RecipeSelection } from '../../styles/recipe-types.js';
import type { SlottedConfigInput } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';
import { fieldMessageIcon } from '../field/recipe.css.js';
import { textInputControlScopeClassName } from './styles.css.js';

// Set per `size` variant on `control` below, from `FIELD_CONTROL_ICON_SIZE`, so the invalid
// `::after` icon matches the icon size the control provides to its prefix and suffix.
const textInputErrorIconSize = createVar();

// Set per `size` variant on `input` below. The resting inline padding is split out so a bare
// input can shrink it while its border thickens, keeping the box (and the text) where it was.
const textInputInlinePadding = createVar();
const textInputInvalidPaddingAdjust = createVar();
const textInputInputPaddingInline = `calc(${textInputInlinePadding} - ${fallbackVar(textInputInvalidPaddingAdjust, '0px')})`;

const control = composeInputStateSelectors();

// A bare `<input>` carries its own state: `:disabled` and `:read-only` match the element itself,
// where the defaults probe for a descendant input.
const input = composeInputStateSelectors({ disabled: ':disabled', readOnly: ':read-only' });

/**
 * Raw slotted config for the TextInput primitives.
 *
 * Slots: `root` (the `TextInputRoot` element), `control` (the `TextInputControl` well chrome),
 * `input` (the `<input>`), and `prefix` / `suffix` (the leading and trailing parts). `isInControl`
 * decides whether `input` draws its own chrome or sits transparent inside a `control`.
 */
const textInputConfig = {
	slots: {
		root: {
			minInlineSize: 0,

			selectors: {
				// With no `TextInputControl`, the input has no room for an in-control icon, so the
				// field's error message carries the icon instead. A control draws its own icon, so the
				// message icon stays off and the field shows exactly one icon.
				[`&:not(:has(${classSelector(textInputControlScopeClassName)}))`]: {
					vars: {
						[fieldMessageIcon]: 'inline-block',
					},
				},
			},
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
						// `invalidFocusWithin` is a strict subset of `invalid` and nothing else here
						// touches `::after`, so this already covers the focused case.
						[`${control.invalid}::after`]: invalidIndicatorIconForcedColors,
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
				// The border stays at the resting 1px here: the `::after` icon is the non-colour
				// cue, so thickening the border as well would be redundant. The gated danger
				// colour is what satisfies the contrast requirement.
				[control.invalid]: {
					borderColor: vars.color.background.danger.solid.rest,
				},
				// The icon is the control's last box, after the input value. `prefix` and the input
				// keep the default `order: 0` and `suffix` takes `order: 1`, so flex layout places the
				// icon between the input and the suffix. `marginInlineEnd` is a constant `space.sp8`
				// to match the combobox chevron inset, and the input's own `paddingInlineEnd`
				// supplies the leading gap.
				[`${control.invalid}::after`]: {
					...invalidIndicatorIcon(textInputErrorIconSize),
					marginInlineEnd: vars.space.sp8,
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
		input: {
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
			// The control's invalid icon is a `::after`, so it renders after this part in document
			// order. An explicit `order` moves the suffix behind the icon (default `order: 0`) in
			// flex layout without touching document order, so the icon lands right after the input
			// value and before this trailing part.
			order: 1,

			selectors: {
				[descendantDisabledSelector]: {
					color: vars.color.text.disabled,
				},
			},
		},
	},
	defaultVariants: {
		isInControl: false,
		size: 'medium',
	},
	variants: {
		isInControl: {
			false: {
				// A standalone or rooted input draws the same well chrome as `control`. Its invalid
				// cue is structural: an inset danger ring doubles the border without changing the
				// box, so the input does not shift when it turns invalid.
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
			},
			true: {
				input: {
					flex: 1,
				},
			},
		},
		size: {
			medium: {
				control: {
					blockSize: vars.controlSize.medium,
					fontSize: FONT_METRIC_SCALE[16].fontSize,
					vars: { [textInputErrorIconSize]: vars.iconSize[FIELD_CONTROL_ICON_SIZE.medium] },
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
					vars: { [textInputErrorIconSize]: vars.iconSize[FIELD_CONTROL_ICON_SIZE.small] },
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
 * `textInputRecipe({ isInControl, size }).root() / .control() / .input() / .prefix() /
 * .suffix()`.
 */
export const textInputRecipe = recipe(textInputConfig);

/** Outer variant selection for the `textInput` recipe. */
export type TextInputRecipeVariants = RecipeSelection<typeof textInputRecipe>;

/** Allowed `size` values for the TextInput primitives. */
export type TextInputSize = keyof typeof textInputConfig.variants.size;
