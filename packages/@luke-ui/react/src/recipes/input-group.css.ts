import type { FieldControlSize } from '../sizing/control-size.js';
import { focusRing } from '../styles/focus-ring.js';
import { vars } from '../theme/contract.css.js';
import type { AssertTrue, TypesAreEqual } from '../types/type-equality.js';
import {
	composeInputStateSelectors,
	descendantDisabledSelector,
	inputStates,
} from './input-states.js';
import type { RecipeSelection, SlottedConfigInput } from './recipe.js';
import { recipe } from './recipe.js';

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
				// The border stays at the resting 1px here: the `invalidIndicator` icon
				// `InputGroup` renders is the non-colour cue, so thickening the border as
				// well would be redundant, and none of the five reference systems this
				// direction is drawn from (Spectrum, Astryx, Polaris, HeroUI, Radix Themes)
				// thicken the border for an invalid control. The gated danger colour is what
				// satisfies the contrast requirement, and it is unchanged.
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
			// lands right after the input's text content and before this trailing part,
			// matching the Spectrum reference this direction is drawn from. It is the one
			// place `InputGroup` departs from pure document order.
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
		// `InputGroup` wraps the group in (`INPUT_GROUP_ICON_SIZE`) rather than from a
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
					fontSize: vars.font[300].fontSize,
				},
				control: {
					blockSize: vars.controlSize.medium,
					paddingInlineEnd: vars.space[300],
					paddingInlineStart: vars.space[300],
				},
				prefix: {
					lineHeight: vars.font[300].lineHeight,
					paddingInlineEnd: vars.space[300],
					paddingInlineStart: vars.space[300],
				},
				suffix: {
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
				prefix: {
					lineHeight: vars.font[200].lineHeight,
					paddingInlineEnd: vars.space[200],
					paddingInlineStart: vars.space[200],
				},
				suffix: {
					lineHeight: vars.font[200].lineHeight,
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
 * `inputGroup({ size }).group() / .control() / .prefix() / .suffix() /
 * .invalidIndicator()`.
 */
export const inputGroup = recipe(inputGroupConfig);

/** Outer variant selection for the `inputGroup` recipe. */
export type InputGroupVariants = RecipeSelection<typeof inputGroup>;

/** Allowed `size` values for the `inputGroup` recipe. */
export type InputGroupSize = keyof typeof inputGroupConfig.variants.size;

// Compile-time guard: `InputGroupSize` (derived above from the recipe config) and
// `FieldControlSize` (the union `INPUT_GROUP_ICON_SIZE` is keyed by) must stay exactly
// the same set of values in both directions, or the icon-size map silently drifts from
// the `size` variants it's meant to cover.
type _InputGroupSizeMatchesFieldControlSize = AssertTrue<
	TypesAreEqual<InputGroupSize, FieldControlSize>
>;
