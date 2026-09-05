import { fontMetrics } from '../../../theme/font-metric-scale.stylex.js';
import { vars } from '../../../theme/tokens.stylex.js';
import { inputGroupInputStates } from '../../styles/input-states.js';
import type { RecipeSelection } from '../../styles/recipe-authoring.js';
import { compiledStyleList, recipe } from '../../styles/recipe-authoring.js';

/**
 * The disabled / hover / focus-within / invalid / read-only state styling on `group` lives in
 * `../../styles/input-states.ts`, shared with the sibling `Combobox` recipe — see that module's
 * block comment for why StyleX forced this into its own module rather than a plain shared helper.
 */
export const inputGroupRecipe = recipe({
	defaultVariants: {
		size: 'medium',
	},
	slots: {
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
			'::placeholder': {
				color: vars.color.text.secondary,
				opacity: 1,
			},
			':where([data-disabled="true"], :disabled)': {
				color: vars.color.text.disabled,
				cursor: 'not-allowed',
			},
		},
		group: [
			{
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
				letterSpacing: fontMetrics.step16.letterSpacing,
				lineHeight: fontMetrics.step16.lineHeight,
				minInlineSize: 0,
				overflow: 'visible',
				transitionDuration: vars.motion.duration.feedback,
				transitionProperty: 'background-color, border-color, color',
				transitionTimingFunction: vars.motion.easing.standard,
			},
			...compiledStyleList(inputGroupInputStates),
		],
		invalidIndicator: {
			color: vars.color.foreground.danger.rest,
			marginInlineEnd: vars.space.sp8,
			'@media (forced-colors: active)': {
				color: 'CanvasText',
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
			':is([data-disabled="true"] *, [aria-disabled="true"] *)': {
				color: vars.color.text.disabled,
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
			// `InputGroup` appends the invalid indicator after its children, so the icon is the group's
			// last DOM child and would otherwise land after this slot. Giving `suffix` an explicit
			// `order` moves it behind the icon (default `order: 0`) in flex layout without touching
			// document order.
			order: 1,
			':is([data-disabled="true"] *, [aria-disabled="true"] *)': {
				color: vars.color.text.disabled,
			},
		},
	},
	variants: {
		size: {
			medium: {
				control: {
					blockSize: vars.controlSize.medium,
					paddingInlineEnd: vars.space.sp12,
					paddingInlineStart: vars.space.sp12,
				},
				group: {
					blockSize: vars.controlSize.medium,
					fontSize: fontMetrics.step16.fontSize,
				},
				prefix: {
					lineHeight: fontMetrics.step16.lineHeight,
					paddingInlineEnd: vars.space.sp12,
					paddingInlineStart: vars.space.sp12,
				},
				suffix: {
					lineHeight: fontMetrics.step16.lineHeight,
					paddingInlineEnd: vars.space.sp12,
					paddingInlineStart: vars.space.sp12,
				},
			},
			small: {
				control: {
					blockSize: vars.controlSize.small,
					paddingInlineEnd: vars.space.sp8,
					paddingInlineStart: vars.space.sp8,
				},
				group: {
					blockSize: vars.controlSize.small,
					fontSize: fontMetrics.step14.fontSize,
					letterSpacing: fontMetrics.step14.letterSpacing,
					lineHeight: fontMetrics.step14.lineHeight,
				},
				prefix: {
					lineHeight: fontMetrics.step14.lineHeight,
					paddingInlineEnd: vars.space.sp8,
					paddingInlineStart: vars.space.sp8,
				},
				suffix: {
					lineHeight: fontMetrics.step14.lineHeight,
					paddingInlineEnd: vars.space.sp8,
					paddingInlineStart: vars.space.sp8,
				},
			},
		},
	},
});

/** Variant selections for the input group. */
export type InputGroupRecipeVariants = RecipeSelection<typeof inputGroupRecipe>;

/** Allowed control sizes. */
export type InputGroupSize = NonNullable<InputGroupRecipeVariants['size']>;
