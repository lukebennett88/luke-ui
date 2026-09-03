import * as stylex from '@stylexjs/stylex';
import { vars } from '../../../theme/tokens.stylex.js';
import { inputGroupInputStates } from '../../styles/input-states.js';
import type { RecipeSelection } from '../../styles/stylex-recipe.js';
import { createSlottedRecipe } from '../../styles/stylex-recipe.js';

/**
 * The disabled / hover / focus-within / invalid / read-only state styling on `group` lives in
 * `../../styles/input-states.ts`, shared with the sibling `Combobox` recipe — see that module's
 * block comment for why StyleX forced this into its own module rather than a plain shared helper.
 */
const styles = stylex.create({
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
	controlSizeMedium: {
		blockSize: vars.controlSize.medium,
		paddingInlineEnd: vars.space.sp12,
		paddingInlineStart: vars.space.sp12,
	},
	controlSizeSmall: {
		blockSize: vars.controlSize.small,
		paddingInlineEnd: vars.space.sp8,
		paddingInlineStart: vars.space.sp8,
	},
	group: {
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
		letterSpacing: '0',
		lineHeight: '24px',
		minInlineSize: 0,
		overflow: 'visible',
		transitionDuration: vars.motion.duration.feedback,
		transitionProperty: 'background-color, border-color, color',
		transitionTimingFunction: vars.motion.easing.standard,
	},
	groupSizeMedium: {
		blockSize: vars.controlSize.medium,
		fontSize: '16px',
	},
	groupSizeSmall: {
		blockSize: vars.controlSize.small,
		fontSize: '14px',
		letterSpacing: '0',
		lineHeight: '20px',
	},
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
	prefixSizeMedium: {
		lineHeight: '24px',
		paddingInlineEnd: vars.space.sp12,
		paddingInlineStart: vars.space.sp12,
	},
	prefixSizeSmall: {
		lineHeight: '20px',
		paddingInlineEnd: vars.space.sp8,
		paddingInlineStart: vars.space.sp8,
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
	suffixSizeMedium: {
		lineHeight: '24px',
		paddingInlineEnd: vars.space.sp12,
		paddingInlineStart: vars.space.sp12,
	},
	suffixSizeSmall: {
		lineHeight: '20px',
		paddingInlineEnd: vars.space.sp8,
		paddingInlineStart: vars.space.sp8,
	},
});

/**
 * Slotted recipe for the `InputGroup` primitive.
 *
 * `inputGroupRecipe({ size }).group() / .control() / .prefix() / .suffix() /
 * .invalidIndicator()`.
 */
export const [inputGroupRecipe, resolveInputGroupRecipeSlotStyles] = createSlottedRecipe({
	defaultVariants: {
		size: 'medium',
	},
	slots: {
		control: styles.control,
		group: [styles.group, ...inputGroupInputStates],
		invalidIndicator: styles.invalidIndicator,
		prefix: styles.prefix,
		suffix: styles.suffix,
	},
	variants: {
		size: {
			medium: {
				control: styles.controlSizeMedium,
				group: styles.groupSizeMedium,
				prefix: styles.prefixSizeMedium,
				suffix: styles.suffixSizeMedium,
			},
			small: {
				control: styles.controlSizeSmall,
				group: styles.groupSizeSmall,
				prefix: styles.prefixSizeSmall,
				suffix: styles.suffixSizeSmall,
			},
		},
	},
});

/** Outer variant selection for the `inputGroup` recipe. */
export type InputGroupRecipeVariants = RecipeSelection<typeof inputGroupRecipe>;

/** Allowed `size` values for the `inputGroup` recipe. */
export type InputGroupSize = NonNullable<InputGroupRecipeVariants['size']>;
