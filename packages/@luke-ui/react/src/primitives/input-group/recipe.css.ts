import { focusRing, restingFocusRing } from '../../styles/focus-ring.js';
import {
	composeInputStateSelectors,
	descendantDisabledSelector,
	inputStates,
} from '../../styles/input-states.js';
import type { RecipeSelection, SlottedConfigInput } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';
import { vars } from '../../theme/contract.css.js';
import { FONT_METRIC_SCALE } from '../../theme/font-metric-scale.js';

const { disabled, focusWithin, hover, invalid, invalidFocusWithin, readOnly, readOnlyFocusWithin } =
	composeInputStateSelectors(inputStates);

/**
 * Raw slotted config for the `InputGroup` primitive.
 *
 * Slots: `group` (tactile well chrome), `control` (the input), `prefix` / `suffix`
 * (the leading and trailing parts), and `invalidIndicator` (the error icon
 * `InputGroup` renders itself).
 */
const inputGroupConfig = {
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
			fontFamily: vars.font.family.body,
			inlineSize: '100%',
			isolation: 'isolate',
			letterSpacing: FONT_METRIC_SCALE[16].letterSpacing,
			lineHeight: FONT_METRIC_SCALE[16].lineHeight,
			minInlineSize: 0,
			...restingFocusRing('0px'),
			overflow: 'visible',
			transitionDuration: vars.motion.duration.feedback,
			transitionProperty: 'background-color, border-color, color',
			transitionTimingFunction: vars.motion.easing.standard,

			selectors: {
				[disabled]: {
					cursor: 'not-allowed',
					opacity: vars.interaction.disabledOpacity,
				},
				[focusWithin]: {
					borderColor: vars.color.border.accent,
					...focusRing(vars.color.border.focus),
				},
				[hover]: {
					borderColor: vars.color.border.accent,
				},
				// The border stays at the resting 1px here: the `invalidIndicator` icon
				// `InputGroup` renders is the non-colour cue, so thickening the border as
				// well would be redundant. The gated danger colour is what satisfies the
				// contrast requirement, and it is unchanged.
				[invalid]: {
					borderColor: vars.color.background.danger.solid.rest,
				},
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
			// `InputGroup` appends the invalid indicator after its children, so the icon
			// is the group's last DOM child and would otherwise land after this slot.
			// Giving `suffix` an explicit `order` moves it behind the icon (default
			// `order: 0`) in flex layout without touching document order, so the icon
			// lands right after the input's text content and before this trailing part.
			// It is the one place `InputGroup` departs from pure document order.
			order: 1,

			selectors: {
				[descendantDisabledSelector]: {
					color: vars.color.text.disabled,
				},
			},
		},
		// The invalid icon `InputGroup` renders itself. Only colour and spacing here:
		// the element is a real `Icon`, so `icon.css.ts` already owns its box dimensions
		// and `flexShrink`, and its per-size step comes from the `IconSizeProvider`
		// `InputGroup` wraps the group in (`FIELD_CONTROL_ICON_SIZE`) rather than from a
		// variant here. `color`, not `background-color`, because an `Icon` fills with
		// `currentColor`. `CanvasText` (not the gated danger token) keeps it a solid,
		// high-contrast shape when author colours are ignored.
		//
		// No `marginInlineStart` here: the `control` slot's own `paddingInlineEnd`
		// already supplies the gap between the value text and the icon, so a margin
		// stacked on top of it would make the leading gap bigger than the trailing one.
		// `marginInlineEnd` is a constant `space[200]`, not a per-size value: it matches
		// `ComboboxField`'s chevron, the system's existing trailing-glyph inset, which is
		// itself constant across sizes rather than scaling with the control's padding.
		// Matching it here means a `TextField` and a `ComboboxField` read the same trailing
		// rhythm at both sizes.
		invalidIndicator: {
			'@media': {
				'(forced-colors: active)': {
					color: 'CanvasText',
				},
			},
			color: vars.color.foreground.danger.rest,
			marginInlineEnd: vars.space[200],
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
					fontSize: FONT_METRIC_SCALE[16].fontSize,
				},
				control: {
					blockSize: vars.controlSize.medium,
					paddingInlineEnd: vars.space[300],
					paddingInlineStart: vars.space[300],
				},
				prefix: {
					lineHeight: FONT_METRIC_SCALE[16].lineHeight,
					paddingInlineEnd: vars.space[300],
					paddingInlineStart: vars.space[300],
				},
				suffix: {
					lineHeight: FONT_METRIC_SCALE[16].lineHeight,
					paddingInlineEnd: vars.space[300],
					paddingInlineStart: vars.space[300],
				},
			},
			small: {
				group: {
					blockSize: vars.controlSize.small,
					fontSize: FONT_METRIC_SCALE[14].fontSize,
					letterSpacing: FONT_METRIC_SCALE[14].letterSpacing,
					lineHeight: FONT_METRIC_SCALE[14].lineHeight,
				},
				control: {
					blockSize: vars.controlSize.small,
					paddingInlineEnd: vars.space[200],
					paddingInlineStart: vars.space[200],
				},
				prefix: {
					lineHeight: FONT_METRIC_SCALE[14].lineHeight,
					paddingInlineEnd: vars.space[200],
					paddingInlineStart: vars.space[200],
				},
				suffix: {
					lineHeight: FONT_METRIC_SCALE[14].lineHeight,
					paddingInlineEnd: vars.space[200],
					paddingInlineStart: vars.space[200],
				},
			},
		},
	},
} as const satisfies SlottedConfigInput;

/**
 * Slotted recipe for the `InputGroup` primitive.
 *
 * `inputGroupRecipe({ size }).group() / .control() / .prefix() / .suffix() /
 * .invalidIndicator()`.
 */
export const inputGroupRecipe = recipe(inputGroupConfig);

/** Outer variant selection for the `inputGroup` recipe. */
export type InputGroupRecipeVariants = RecipeSelection<typeof inputGroupRecipe>;

/** Allowed `size` values for the `inputGroup` recipe. */
export type InputGroupSize = keyof typeof inputGroupConfig.variants.size;
