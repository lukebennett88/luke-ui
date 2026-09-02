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
		color: vars.colorTextPrimary,
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
			color: vars.colorTextSecondary,
			opacity: 1,
		},
		':where([data-disabled="true"], :disabled)': {
			color: vars.colorTextDisabled,
			cursor: 'not-allowed',
		},
	},
	controlSizeMedium: {
		'block-size': vars.controlSizeMedium,
		'padding-inline-end': vars.spaceSp12,
		'padding-inline-start': vars.spaceSp12,
	},
	controlSizeSmall: {
		'block-size': vars.controlSizeSmall,
		'padding-inline-end': vars.spaceSp8,
		'padding-inline-start': vars.spaceSp8,
	},
	group: {
		alignItems: 'center',
		backgroundColor: vars.colorSurfaceRecessed,
		borderColor: vars.colorBorderControl,
		borderRadius: vars.radiusControl,
		borderStyle: 'solid',
		borderWidth: '1px',
		boxShadow: vars.depthRecessed,
		cursor: 'text',
		display: 'inline-flex',
		fontFamily: vars.fontFamilyBody,
		'inline-size': '100%',
		isolation: 'isolate',
		letterSpacing: '0',
		lineHeight: '24px',
		'min-inline-size': 0,
		overflow: 'visible',
		transitionDuration: vars.motionDurationFeedback,
		transitionProperty: 'background-color, border-color, color',
		transitionTimingFunction: vars.motionEasingStandard,
	},
	groupSizeMedium: {
		'block-size': vars.controlSizeMedium,
		fontSize: '16px',
	},
	groupSizeSmall: {
		'block-size': vars.controlSizeSmall,
		fontSize: '14px',
		letterSpacing: '0',
		lineHeight: '20px',
	},
	invalidIndicator: {
		color: vars.colorForegroundDangerRest,
		'margin-inline-end': vars.spaceSp8,
		'@media (forced-colors: active)': {
			color: 'CanvasText',
		},
	},
	prefix: {
		alignItems: 'center',
		'border-inline-end-color': vars.colorBorderControl,
		'border-inline-end-style': 'solid',
		'border-inline-end-width': '1px',
		color: vars.colorTextSecondary,
		display: 'inline-flex',
		flexShrink: 0,
		':is([data-disabled="true"] *, [aria-disabled="true"] *)': {
			color: vars.colorTextDisabled,
		},
	},
	prefixSizeMedium: {
		lineHeight: '24px',
		'padding-inline-end': vars.spaceSp12,
		'padding-inline-start': vars.spaceSp12,
	},
	prefixSizeSmall: {
		lineHeight: '20px',
		'padding-inline-end': vars.spaceSp8,
		'padding-inline-start': vars.spaceSp8,
	},
	suffix: {
		alignItems: 'center',
		'border-inline-start-color': vars.colorBorderControl,
		'border-inline-start-style': 'solid',
		'border-inline-start-width': '1px',
		color: vars.colorTextSecondary,
		display: 'inline-flex',
		flexShrink: 0,
		// `InputGroup` appends the invalid indicator after its children, so the icon is the group's
		// last DOM child and would otherwise land after this slot. Giving `suffix` an explicit
		// `order` moves it behind the icon (default `order: 0`) in flex layout without touching
		// document order.
		order: 1,
		':is([data-disabled="true"] *, [aria-disabled="true"] *)': {
			color: vars.colorTextDisabled,
		},
	},
	suffixSizeMedium: {
		lineHeight: '24px',
		'padding-inline-end': vars.spaceSp12,
		'padding-inline-start': vars.spaceSp12,
	},
	suffixSizeSmall: {
		lineHeight: '20px',
		'padding-inline-end': vars.spaceSp8,
		'padding-inline-start': vars.spaceSp8,
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
