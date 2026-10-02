import { vars } from '../../../theme/contract.css.js';
import { FONT_METRIC_SCALE } from '../../../theme/font-metric-scale.js';
import { focusRing } from '../../styles/focus-ring.js';
import { composeInputStateSelectors } from '../../styles/input-states.js';
import type { RecipeSelection } from '../../styles/recipe-types.js';
import { recipe } from '../../styles/recipe.js';
import {
	textInputInlinePadding,
	textInputInputBase,
	textInputInputPaddingInline,
	textInputInvalidPaddingAdjust,
} from './styles.css.js';

// A bare `<input>` carries its own state: `:disabled` and `:read-only` match the element itself,
// where the defaults probe for a descendant input.
const input = composeInputStateSelectors({ disabled: ':disabled', readOnly: ':read-only' });

/**
 * Recipe for a standalone text input: `<input className={textInputRecipe({ size })} />`.
 *
 * The input draws its own well chrome. Its invalid cue is structural, because it may stand alone
 * with no error message: an inset danger ring doubles the border without changing the box, so the
 * input does not shift when it turns invalid.
 */
export const textInputRecipe = recipe({
	base: {
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
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: {
			medium: {
				blockSize: vars.controlSize.medium,
				fontSize: FONT_METRIC_SCALE[16].fontSize,
				letterSpacing: FONT_METRIC_SCALE[16].letterSpacing,
				lineHeight: FONT_METRIC_SCALE[16].lineHeight,
				paddingInlineEnd: textInputInputPaddingInline,
				paddingInlineStart: textInputInputPaddingInline,
				vars: { [textInputInlinePadding]: vars.space.sp12 },
			},
			small: {
				blockSize: vars.controlSize.small,
				fontSize: FONT_METRIC_SCALE[14].fontSize,
				letterSpacing: FONT_METRIC_SCALE[14].letterSpacing,
				lineHeight: FONT_METRIC_SCALE[14].lineHeight,
				paddingInlineEnd: textInputInputPaddingInline,
				paddingInlineStart: textInputInputPaddingInline,
				vars: { [textInputInlinePadding]: vars.space.sp8 },
			},
		},
	},
});

/** Variant selection for the `textInput` recipe. */
export type TextInputRecipeVariants = RecipeSelection<typeof textInputRecipe>;

/** Allowed `size` values for the TextInput primitives. */
export type TextInputSize = NonNullable<TextInputRecipeVariants['size']>;
