import * as stylex from '@stylexjs/stylex';
import { tokens } from '../../../theme/tokens.stylex.js';
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
		color: tokens.colorTextPrimary,
		cursor: 'text',
		flex: 1,
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: 'inherit',
		'inline-size': '100%',
		letterSpacing: 'inherit',
		lineHeight: 'inherit',
		'min-inline-size': 0,
		outlineColor: 'transparent',
		outlineStyle: 'none',
		outlineWidth: 0,
		'padding-block-end': 0,
		'padding-block-start': 0,
		'::placeholder': {
			color: tokens.colorTextSecondary,
			opacity: 1,
		},
		':where([data-disabled="true"], :disabled)': {
			color: tokens.colorTextDisabled,
			cursor: 'not-allowed',
		},
	},
	controlSizeMedium: {
		'block-size': tokens.controlSizeMedium,
		'padding-inline-end': tokens.spaceSp12,
		'padding-inline-start': tokens.spaceSp12,
	},
	controlSizeSmall: {
		'block-size': tokens.controlSizeSmall,
		'padding-inline-end': tokens.spaceSp8,
		'padding-inline-start': tokens.spaceSp8,
	},
	group: {
		alignItems: 'center',
		backgroundColor: tokens.colorSurfaceRecessed,
		borderColor: tokens.colorBorderControl,
		borderRadius: tokens.radiusControl,
		borderStyle: 'solid',
		borderWidth: '1px',
		boxShadow: tokens.depthRecessed,
		cursor: 'text',
		display: 'inline-flex',
		fontFamily: tokens.fontFamilyBody,
		'inline-size': '100%',
		isolation: 'isolate',
		letterSpacing: '0',
		lineHeight: '24px',
		'min-inline-size': 0,
		overflow: 'visible',
		transitionDuration: tokens.motionDurationFeedback,
		transitionProperty: 'background-color, border-color, color',
		transitionTimingFunction: tokens.motionEasingStandard,
	},
	groupSizeMedium: {
		'block-size': tokens.controlSizeMedium,
		fontSize: '16px',
	},
	groupSizeSmall: {
		'block-size': tokens.controlSizeSmall,
		fontSize: '14px',
		letterSpacing: '0',
		lineHeight: '20px',
	},
	invalidIndicator: {
		color: tokens.colorForegroundDangerRest,
		'margin-inline-end': tokens.spaceSp8,
		'@media (forced-colors: active)': {
			color: 'CanvasText',
		},
	},
	prefix: {
		alignItems: 'center',
		'border-inline-end-color': tokens.colorBorderControl,
		'border-inline-end-style': 'solid',
		'border-inline-end-width': '1px',
		color: tokens.colorTextSecondary,
		display: 'inline-flex',
		flexShrink: 0,
		':is([data-disabled="true"] *, [aria-disabled="true"] *)': {
			color: tokens.colorTextDisabled,
		},
	},
	prefixSizeMedium: {
		lineHeight: '24px',
		'padding-inline-end': tokens.spaceSp12,
		'padding-inline-start': tokens.spaceSp12,
	},
	prefixSizeSmall: {
		lineHeight: '20px',
		'padding-inline-end': tokens.spaceSp8,
		'padding-inline-start': tokens.spaceSp8,
	},
	suffix: {
		alignItems: 'center',
		'border-inline-start-color': tokens.colorBorderControl,
		'border-inline-start-style': 'solid',
		'border-inline-start-width': '1px',
		color: tokens.colorTextSecondary,
		display: 'inline-flex',
		flexShrink: 0,
		// `InputGroup` appends the invalid indicator after its children, so the icon is the group's
		// last DOM child and would otherwise land after this slot. Giving `suffix` an explicit
		// `order` moves it behind the icon (default `order: 0`) in flex layout without touching
		// document order.
		order: 1,
		':is([data-disabled="true"] *, [aria-disabled="true"] *)': {
			color: tokens.colorTextDisabled,
		},
	},
	suffixSizeMedium: {
		lineHeight: '24px',
		'padding-inline-end': tokens.spaceSp12,
		'padding-inline-start': tokens.spaceSp12,
	},
	suffixSizeSmall: {
		lineHeight: '20px',
		'padding-inline-end': tokens.spaceSp8,
		'padding-inline-start': tokens.spaceSp8,
	},
});

/**
 * Slotted recipe for the `InputGroup` primitive.
 *
 * `inputGroupRecipe({ size }).group() / .control() / .prefix() / .suffix() /
 * .invalidIndicator()`.
 */
export const { recipe: inputGroupRecipe, resolveSlotStyles: resolveInputGroupRecipeSlotStyles } =
	createSlottedRecipe({
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
