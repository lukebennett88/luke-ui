import * as stylex from '@stylexjs/stylex';
import { tokens } from '../../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../../styles/stylex-recipe.js';
import { createSlottedRecipe } from '../../styles/stylex-recipe.js';

/*
 * ## Why these state selectors are spelled out in full, twice
 *
 * The selector fragments below (disabled / hover / focus-within / invalid / read-only, each
 * `:not()`-excluding the others) are identical to the ones in the sibling recipe, and were once a
 * shared `composeInputStateSelectors()` helper. StyleX has no seam for them:
 *
 * - A plain `.ts` module of string constants cannot be imported into a `stylex.create` file at all
 *   ("Could not resolve the path to the imported file") — the compiler skips any module that does
 *   not import `@stylexjs/stylex`.
 * - `stylex.defineConsts` in a `*.stylex.ts` file imports fine and compiles in the dev/test
 *   pipeline, but silently corrupts the packed stylesheet. `processStylexRules` substitutes a const
 *   by string-replacing `var(--<hash>)` in the rule text, then rewrites any leftover `--<hash>:`
 *   into the target property name. A const spliced into a *selector* carries the bare `--<hash>`
 *   without the `var()` wrapper, so the first replace misses and the second mangles the selector —
 *   `:where(--x6a4wab))…` became `ar(--x6a4wab))…`, emitting 53 broken rules that no test caught
 *   because unit and browser tests use the dev pipeline. `defineConsts` is safe as a declaration
 *   *value* only, never inside a selector key.
 *
 *
 * ## What the state fragments mean
 *
 * The invalid state deliberately avoids `:has(:invalid)`. Native `:invalid` matches an empty
 * required input from first render — before any interaction or submit — while React Aria's
 * `data-invalid`/`aria-invalid` stay null until validation actually runs. Styling on
 * `:has(:invalid)` would paint an untouched required field invalid while telling assistive
 * technology it is fine.
 *
 * `:read-only` is scoped to `input` for the same kind of reason: bare `:read-only` matches any
 * non-editable element (spans, buttons), so `:has(:read-only)` would match any control that
 * contains a prefix, suffix, or trigger.
 *
 * `input-states.test.ts` pins these selectors so the two recipes cannot drift apart unnoticed.
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
		':where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))':
			{
				cursor: 'not-allowed',
				opacity: tokens.interactionDisabledOpacity,
			},
		':where([data-hovered="true"], :hover):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within)):not(:where([data-readonly="true"], :has(input:read-only))):not(:where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])))':
			{
				borderColor: tokens.colorBorderAccent,
			},
		':where([data-focus-within="true"], :focus-within):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"]))):not(:where([data-readonly="true"], :has(input:read-only)))':
			{
				borderColor: tokens.colorBorderAccent,
				outlineColor: tokens.colorBorderFocus,
				outlineOffset: '2px',
				outlineStyle: 'solid',
				outlineWidth: '2px',
			},
		':where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within)):not(:where([data-readonly="true"], :has(input:read-only)))':
			{
				borderColor: tokens.colorBackgroundDangerSolidRest,
			},
		':where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])):where([data-focus-within="true"], :focus-within):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-readonly="true"], :has(input:read-only)))':
			{
				borderColor: tokens.colorBackgroundDangerSolidRest,
				outlineColor: tokens.colorBorderFocus,
				outlineOffset: '2px',
				outlineStyle: 'solid',
				outlineWidth: '2px',
			},
		':where([data-readonly="true"], :has(input:read-only)):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within))':
			{
				backgroundColor: tokens.colorSurfaceCanvas,
				borderColor: tokens.colorBorderDecorative,
				boxShadow: 'none',
			},
		':where([data-readonly="true"], :has(input:read-only)):where([data-focus-within="true"], :focus-within):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])))':
			{
				backgroundColor: tokens.colorSurfaceCanvas,
				borderColor: tokens.colorBorderDecorative,
				boxShadow: 'none',
				outlineColor: tokens.colorBorderFocus,
				outlineOffset: '2px',
				outlineStyle: 'solid',
				outlineWidth: '2px',
			},
		'@media (forced-colors: active)': {
			backgroundColor: 'Field',
			borderColor: 'FieldText',
			boxShadow: 'none',
			color: 'FieldText',
			forcedColorAdjust: 'auto',
			':where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))':
				{
					borderColor: 'GrayText',
					color: 'GrayText',
					opacity: 1,
				},
			':where([data-focus-within="true"], :focus-within):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])))':
				{
					outlineColor: 'Highlight',
				},
		},
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
export const { recipe: inputGroupRecipe, resolveStyles: resolveInputGroupRecipeStyles } =
	createSlottedRecipe({
		defaultVariants: {
			size: 'medium',
		},
		slots: {
			control: styles.control,
			group: styles.group,
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
