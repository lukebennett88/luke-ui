import { createVar } from '@vanilla-extract/css';
import { focusRing } from '../styles/focus-ring.js';
import { vars } from '../theme/contract.css.js';
import {
	composeInputStateSelectors,
	descendantDisabledSelector,
	inputStates,
} from './input-states.js';
import { invalidIndicatorIcon, invalidIndicatorIconForcedColors } from './invalid-indicator.js';
import type { RecipeSelection, SlottedConfigInput } from './recipe.js';
import { recipe } from './recipe.js';

const { disabled, focusWithin, hover, invalid, invalidFocusWithin, readOnly, readOnlyFocusWithin } =
	composeInputStateSelectors(inputStates);

// Set per `size` variant on `group` below, at the same `small`/`medium` → `xsmall`/`small`
// icon-size mapping `sizing/combobox-sizing.ts` uses for Combobox, so the invalid `::after`
// icon matches the control's own scale instead of a constant. TextInput's adornments are
// caller-supplied — there is no internal icon here to match sizes with directly — but the
// two field controls should still scale their error icon the same way.
const textInputErrorIconSize = createVar();

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
						// `invalidFocusWithin` is a strict subset of `invalid` and nothing else
						// here touches `::after`, so this already covers the focused case.
						[`${invalid}::after`]: invalidIndicatorIconForcedColors,
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
					borderColor: vars.color.border.accent,
					...focusRing(vars.color.border.focus),
				},
				[hover]: {
					borderColor: vars.color.border.accent,
				},
				// The border stays at the resting 1px here: the in-control icon just below
				// (`::after`) is the non-colour cue, so thickening the border as well would
				// be redundant, and none of the five reference systems this direction is
				// drawn from (Spectrum, Astryx, Polaris, HeroUI, Radix Themes) thicken the
				// border for an invalid control. The gated danger colour is what satisfies
				// the contrast requirement, and it is unchanged.
				[invalid]: {
					borderColor: vars.color.background.danger.solid.rest,
				},
				// `invalidFocusWithin` is a strict subset of `invalid` and nothing else
				// here touches `::after`, so this already covers the focused case.
				[`${invalid}::after`]: invalidIndicatorIcon(textInputErrorIconSize),
				[invalidFocusWithin]: {
					borderColor: vars.color.background.danger.solid.rest,
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
			// The invalid `::after` icon below is the group's last DOM child (a
			// pseudo-element always renders after real children), which put it after
			// this slot too. Giving `adornmentEnd` an explicit `order` moves it behind
			// the icon (default `order: 0`) in flex layout without touching document
			// order, so the icon lands right after the input's text content and before
			// this trailing adornment, matching the Spectrum reference this direction
			// is drawn from.
			order: 1,

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
					vars: { [textInputErrorIconSize]: vars.iconSize.small },
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
					vars: { [textInputErrorIconSize]: vars.iconSize.xsmall },
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
