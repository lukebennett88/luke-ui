import type { StyleRule } from '@vanilla-extract/css';
import { createVar, fallbackVar } from '@vanilla-extract/css';
import { vars } from '../../../theme/contract.css.js';
import { FONT_METRIC_SCALE } from '../../../theme/font-metric-scale.js';
import { controlBorderState } from '../../styles/control-border.js';
import { focusRing } from '../../styles/focus-ring.js';
import {
	composeInputStateSelectors,
	descendantDisabledSelector,
} from '../../styles/input-states.js';
import { style } from '../../styles/layered-style.css.js';
import type { SlottedConfigInput } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';
import { surfaceStyle } from '../../styles/surface.js';

/**
 * Resting inline padding of the input, set per `size`. A standalone input sets it on itself, and
 * the control sets it for the input inside it. A bare input shrinks it while its border thickens,
 * keeping the box and the text where they were.
 */
export const textInputInlinePadding = createVar();
export const textInputInvalidPaddingAdjust = createVar();
export const textInputInputPaddingInline = `calc(${textInputInlinePadding} - ${fallbackVar(textInputInvalidPaddingAdjust, '0px')})`;

/** Fills painted by the browser (`:autofill`) or a password manager (1Password's marker). */
export const filledInputSelectors = ':autofill, :-webkit-autofill, [data-com-onepassword-filled]';

/**
 * An externally filled input inside a control, which draws the field itself. The fill's
 * `!important` background can't be overridden, so it is clipped to the text, where the text covers
 * it.
 *
 * A standalone input draws its own field with its background, so it keeps the fill instead,
 * inside its own rounded border.
 */
export const filledInputStyle = { backgroundClip: 'text' } as const satisfies StyleRule;

/**
 * Browser autofill also sets `color` with `!important`, which no author colour can override, so
 * the text fill restores ours. A consumer's own colour can't survive it. A password manager's fill
 * leaves `color` alone, so its text keeps the input's colour, a consumer's included.
 */
export const autofilledInputSelector = ':where(:autofill, :-webkit-autofill)';

export const autofilledInputStyle = {
	'@media': {
		'(forced-colors: active)': {
			WebkitTextFillColor: 'currentColor',
			caretColor: 'currentColor',
		},
	},
	WebkitTextFillColor: vars.color.text.primary,
	caretColor: vars.color.text.primary,
} as const satisfies StyleRule;

/** A disabled autofilled input keeps its disabled text. */
export const autofilledDisabledInputSelector = `${autofilledInputSelector}:where([data-disabled="true"], :disabled)`;

export const autofilledDisabledInputStyle = {
	'@media': {
		'(forced-colors: active)': { WebkitTextFillColor: 'GrayText' },
	},
	WebkitTextFillColor: vars.color.text.disabled,
} as const satisfies StyleRule;

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

/**
 * Slotted recipe for the parts around a `TextInput`: `root` (the `TextInputRoot` element),
 * `control` (the `TextInputControl` well chrome), and `prefix` / `suffix` (the leading and
 * trailing parts). It is private. The public `textInputRecipe` styles a standalone input.
 */
export const textInputPartsRecipe = recipe({
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
					},
				},
			},
			alignItems: 'center',
			...surfaceStyle('surface.base'),
			borderColor: vars.color.border.control,
			borderRadius: vars.radius.control,
			borderStyle: 'solid',
			borderWidth: '1px',
			boxShadow: vars.shadow.inset,
			cursor: 'text',
			display: 'inline-flex',
			fontFamily: vars.font.family.body,
			inlineSize: '100%',
			isolation: 'isolate',
			letterSpacing: FONT_METRIC_SCALE[16].letterSpacing,
			lineHeight: FONT_METRIC_SCALE[16].lineHeight,
			minInlineSize: 0,
			overflow: 'visible',
			transitionDuration: vars.motion.feedback.duration,
			transitionProperty: 'background-color, border-color, box-shadow, color',
			transitionTimingFunction: vars.motion.feedback.easing,

			// Precedence: invalid beats read-only and hover. Focus only adds the ring, so it composes
			// with every state.
			selectors: {
				[control.disabled]: {
					cursor: 'not-allowed',
					opacity: vars.interaction.disabledOpacity,
				},
				[control.focusWithin]: focusRing(vars.color.border.focus),
				[control.hover]: {
					borderColor: controlBorderState('hover'),
				},
				// Read-only drops the inset shadow. The hover selector already excludes it.
				[control.readOnly]: {
					boxShadow: 'none',
				},
				// The field's error message carries the non-colour invalid cue, so the border keeps
				// its resting width and only takes the danger colour.
				[control.invalid]: {
					borderColor: vars.color.border.danger,
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
					blockSize: vars.controlSize.px40,
					fontSize: FONT_METRIC_SCALE[16].fontSize,
					vars: { [textInputInlinePadding]: vars.space['12'] },
				},
				prefix: {
					lineHeight: FONT_METRIC_SCALE[16].lineHeight,
					paddingInlineEnd: vars.space['12'],
					paddingInlineStart: vars.space['12'],
				},
				suffix: {
					lineHeight: FONT_METRIC_SCALE[16].lineHeight,
					paddingInlineEnd: vars.space['12'],
					paddingInlineStart: vars.space['12'],
				},
			},
			small: {
				control: {
					blockSize: vars.controlSize.px32,
					fontSize: FONT_METRIC_SCALE[14].fontSize,
					letterSpacing: FONT_METRIC_SCALE[14].letterSpacing,
					lineHeight: FONT_METRIC_SCALE[14].lineHeight,
					vars: { [textInputInlinePadding]: vars.space['8'] },
				},
				prefix: {
					lineHeight: FONT_METRIC_SCALE[14].lineHeight,
					paddingInlineEnd: vars.space['8'],
					paddingInlineStart: vars.space['8'],
				},
				suffix: {
					lineHeight: FONT_METRIC_SCALE[14].lineHeight,
					paddingInlineEnd: vars.space['8'],
					paddingInlineStart: vars.space['8'],
				},
			},
		},
	},
} as const satisfies SlottedConfigInput);

/**
 * Class for a `TextInput` inside a `TextInputControl`, in place of `textInputRecipe`. The control
 * draws the chrome and sets the size, so the input stays transparent and inherits the control's
 * typography and inline padding.
 */
export const textInputInControlClassName = style(
	{
		...textInputInputBase,
		blockSize: '100%',
		flex: 1,
		fontSize: 'inherit',
		letterSpacing: 'inherit',
		lineHeight: 'inherit',
		paddingInlineEnd: textInputInlinePadding,
		paddingInlineStart: textInputInlinePadding,

		selectors: {
			...textInputInputBase.selectors,
			[`&:where(${filledInputSelectors})`]: filledInputStyle,
			[`&${autofilledInputSelector}`]: autofilledInputStyle,
			// Forced colours show a disabled input's text in FieldText inside a control, not the
			// GrayText of a standalone input, so the filled text follows its current colour.
			[`&${autofilledDisabledInputSelector}`]: {
				...autofilledDisabledInputStyle,
				'@media': { '(forced-colors: active)': { WebkitTextFillColor: 'currentColor' } },
			},
		},
	},
	'text-input-in-control',
);
