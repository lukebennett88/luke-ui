import { focusRing } from '../styles/focus-ring.js';
import { vars } from '../theme/contract.css.js';
import {
	composeInputStateSelectors,
	descendantDisabledSelector,
	inputStates,
} from './input-states.css.js';
import type { RecipeSelection, SlottedConfigInput } from './recipe.js';
import { recipe } from './recipe.js';

const { disabled, focusWithin, hover, invalid, invalidFocusWithin, readOnly, readOnlyFocusWithin } =
	composeInputStateSelectors(inputStates);

/**
 * Raw slotted config for the `TextInput` primitive.
 *
 * Slots: `group` (tactile well chrome), `control` (the input), and
 * `adornmentStart` / `adornmentEnd`.
 */
const textInputConfig = {
	slots: {
		group: {
			'@media': {
				'(forced-colors: active)': {
					backgroundColor: 'Field',
					borderColor: 'FieldText',
					boxShadow: 'none',
					color: 'FieldText',
					forcedColorAdjust: 'auto',
					selectors: {
						[disabled]: {
							borderColor: 'GrayText',
							color: 'GrayText',
							opacity: 1,
						},
						[focusWithin]: {
							outlineColor: 'Highlight',
						},
						[invalidFocusWithin]: {
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
			fontFamily: vars.font.family,
			inlineSize: '100%',
			isolation: 'isolate',
			letterSpacing: vars.font[300].letterSpacing,
			lineHeight: vars.font[300].lineHeight,
			minInlineSize: 0,
			outlineColor: 'transparent',
			outlineOffset: 0,
			outlineStyle: 'solid',
			outlineWidth: '2px',
			overflow: 'visible',
			transitionDuration: vars.motion.duration.fast,
			transitionProperty: 'background-color, border-color, color',
			transitionTimingFunction: vars.motion.easing.standard,

			selectors: {
				[disabled]: {
					cursor: 'not-allowed',
					opacity: 0.55,
				},
				[focusWithin]: {
					borderColor: vars.color.intent.accent.border,
					...focusRing(vars.color.border.focus),
				},
				[hover]: {
					borderColor: vars.color.intent.accent.border,
				},
				[invalid]: {
					borderColor: vars.color.intent.danger.border,
				},
				[invalidFocusWithin]: {
					borderColor: vars.color.intent.danger.border,
					...focusRing(vars.color.border.focus),
				},
				[readOnly]: {
					backgroundColor: vars.color.surface.canvas,
					borderColor: vars.color.border.decorative,
					boxShadow: 'none',
				},
				[readOnlyFocusWithin]: {
					...focusRing(vars.color.border.focus),
				},
			},
		},
		control: {
			appearance: 'none',
			backgroundColor: 'transparent',
			borderColor: 'transparent',
			borderStyle: 'none',
			borderWidth: 0,
			color: vars.color.text.primary,
			cursor: 'text',
			flex: 1,
			fontFamily: 'inherit',
			fontSize: 'inherit',
			fontWeight: 'inherit',
			inlineSize: '100%',
			letterSpacing: 'inherit',
			lineHeight: 'inherit',
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
		adornmentStart: {
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
		adornmentEnd: {
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
				group: {
					blockSize: vars.controlSize.medium,
					fontSize: vars.font[300].fontSize,
				},
				control: {
					blockSize: vars.controlSize.medium,
					paddingInlineEnd: vars.space[300],
					paddingInlineStart: vars.space[300],
				},
				adornmentStart: {
					lineHeight: vars.font[300].lineHeight,
					paddingInlineEnd: vars.space[300],
					paddingInlineStart: vars.space[300],
				},
				adornmentEnd: {
					lineHeight: vars.font[300].lineHeight,
					paddingInlineEnd: vars.space[300],
					paddingInlineStart: vars.space[300],
				},
			},
			small: {
				group: {
					blockSize: vars.controlSize.small,
					fontSize: vars.font[200].fontSize,
					letterSpacing: vars.font[200].letterSpacing,
					lineHeight: vars.font[200].lineHeight,
				},
				control: {
					blockSize: vars.controlSize.small,
					paddingInlineEnd: vars.space[200],
					paddingInlineStart: vars.space[200],
				},
				adornmentStart: {
					lineHeight: vars.font[200].lineHeight,
					paddingInlineEnd: vars.space[200],
					paddingInlineStart: vars.space[200],
				},
				adornmentEnd: {
					lineHeight: vars.font[200].lineHeight,
					paddingInlineEnd: vars.space[200],
					paddingInlineStart: vars.space[200],
				},
			},
		},
	},
} as const satisfies SlottedConfigInput;

/**
 * Slotted recipe for the `TextInput` primitive.
 *
 * `textInput({ size }).group() / .control() / .adornmentStart() / .adornmentEnd()`.
 */
export const textInput = recipe(textInputConfig);

/** Outer variant selection for the `TextInput` recipe. */
export type TextInputVariants = RecipeSelection<typeof textInput>;

/** Allowed `size` values for the `TextInput` recipe. */
export type TextInputSize = keyof typeof textInputConfig.variants.size;
