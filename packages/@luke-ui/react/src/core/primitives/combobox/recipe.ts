import * as stylex from '@stylexjs/stylex';
import { tokens } from '../../../theme/tokens.stylex.js';
import { invalidIndicator } from '../../styles/invalid-indicator.stylex.js';
import type { RecipeSelection } from '../../styles/stylex-recipe.js';
import { createSlottedRecipe } from '../../styles/stylex-recipe.js';

/**
 * The in-control invalid icon, rendered as an `::after` on the control and reordered ahead of the
 * trailing affordances (`clearButton`/`trigger`) with flex `order` below. No `margin-inline-start`:
 * the control's own `padding-inline-end` already supplies the leading gap, so a margin here would
 * double it. The size follows the `small`/`medium` control-size variants through the
 * `--luke-combobox-error-icon-size` custom property they set.
 *
 * A file-local object rather than a shared export: StyleX only inlines a spread it can resolve
 * statically in the same module, so the declarations cannot cross a module boundary. The mask URL
 * itself does travel, as a `defineConsts` value.
 */
const invalidIndicatorIcon = {
	backgroundColor: tokens.colorForegroundDangerRest,
	'block-size': 'var(--luke-combobox-error-icon-size)',
	content: "''",
	flexShrink: 0,
	'inline-size': 'var(--luke-combobox-error-icon-size)',
	'margin-inline-end': tokens.spaceSp4,
	maskImage: invalidIndicator.maskImage,
	maskPosition: 'center',
	maskRepeat: 'no-repeat',
	maskSize: 'contain',
} as const;

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
 *
 * One intentional difference from `InputGroup`: every focus-within clause here also requires
 * `:has(input:focus)`. The combobox anatomy puts a trigger and a clear button inside the group, so
 * plain `:focus-within` would also match when one of those buttons holds focus; `InputGroup` has no
 * such buttons and uses the bare condition.
 */
const styles = stylex.create({
	root: {
		display: 'flex',
		flexDirection: 'column',
		'inline-size': '100%',
		'min-inline-size': 0,
	},
	inputGroup: {
		alignItems: 'center',
		backgroundColor: tokens.colorSurfaceRecessed,
		borderColor: tokens.colorBorderControl,
		borderRadius: tokens.radiusControl,
		borderStyle: 'solid',
		borderWidth: '1px',
		boxShadow: tokens.depthRecessed,
		color: tokens.colorTextPrimary,
		cursor: 'text',
		display: 'inline-flex',
		fontFamily: tokens.fontFamilyBody,
		'inline-size': '100%',
		isolation: 'isolate',
		letterSpacing: '0',
		lineHeight: '24px',
		'min-inline-size': 0,
		outlineColor: 'transparent',
		outlineStyle: 'none',
		outlineWidth: 0,
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
		':where([data-focus-within="true"], :focus-within):has(input:focus):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"]))):not(:where([data-readonly="true"], :has(input:read-only)))':
			{
				borderColor: tokens.colorBorderAccent,
				outlineColor: tokens.colorBorderFocus,
				outlineOffset: '2px',
				outlineStyle: 'solid',
				outlineWidth: '2px',
			},
		':where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within):has(input:focus)):not(:where([data-readonly="true"], :has(input:read-only)))':
			{
				borderColor: tokens.colorBackgroundDangerSolidRest,
				'::after': invalidIndicatorIcon,
			},
		':where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])):where([data-focus-within="true"], :focus-within):has(input:focus):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-readonly="true"], :has(input:read-only)))':
			{
				borderColor: tokens.colorBackgroundDangerSolidRest,
				outlineColor: tokens.colorBorderFocus,
				outlineOffset: '2px',
				outlineStyle: 'solid',
				outlineWidth: '2px',
				'::after': invalidIndicatorIcon,
			},
		':where([data-readonly="true"], :has(input:read-only)):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within):has(input:focus))':
			{
				backgroundColor: tokens.colorSurfaceCanvas,
				borderColor: tokens.colorBorderDecorative,
				boxShadow: 'none',
			},
		':where([data-readonly="true"], :has(input:read-only)):where([data-focus-within="true"], :focus-within):has(input:focus):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])))':
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
			':where([data-hovered="true"], :hover):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within)):not(:where([data-readonly="true"], :has(input:read-only))):not(:where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])))':
				{
					borderColor: 'FieldText',
				},
			':where([data-focus-within="true"], :focus-within):has(input:focus):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"]))):not(:where([data-readonly="true"], :has(input:read-only)))':
				{
					borderColor: 'FieldText',
					outlineColor: 'Highlight',
				},
			':where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within):has(input:focus)):not(:where([data-readonly="true"], :has(input:read-only)))':
				{
					borderColor: 'FieldText',
					'::after': {
						backgroundColor: invalidIndicator.forcedColorsBackgroundColor,
					},
				},
			':where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])):where([data-focus-within="true"], :focus-within):has(input:focus):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-readonly="true"], :has(input:read-only)))':
				{
					borderColor: 'FieldText',
					outlineColor: 'Highlight',
					'::after': {
						backgroundColor: invalidIndicator.forcedColorsBackgroundColor,
					},
				},
			':where([data-readonly="true"], :has(input:read-only)):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within):has(input:focus))':
				{
					backgroundColor: 'Field',
					borderColor: 'FieldText',
				},
			':where([data-readonly="true"], :has(input:read-only)):where([data-focus-within="true"], :focus-within):has(input:focus):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])))':
				{
					backgroundColor: 'Field',
					borderColor: 'FieldText',
					outlineColor: 'Highlight',
				},
		},
		'@media (prefers-reduced-motion: reduce)': {
			transitionDuration: '0s',
			transitionProperty: 'none',
		},
	},
	inputGroupSizeMedium: {
		'--luke-combobox-error-icon-size': tokens.iconSizeSmall,
		'block-size': tokens.controlSizeMedium,
		fontSize: '16px',
	},
	inputGroupSizeSmall: {
		'--luke-combobox-error-icon-size': tokens.iconSizeXsmall,
		'block-size': tokens.controlSizeSmall,
		fontSize: '14px',
		letterSpacing: '0',
		lineHeight: '20px',
	},
	textInput: {
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
	textInputSizeMedium: {
		'block-size': tokens.controlSizeMedium,
		'padding-inline-end': tokens.spaceSp12,
		'padding-inline-start': tokens.spaceSp12,
	},
	textInputSizeSmall: {
		'block-size': tokens.controlSizeSmall,
		'padding-inline-end': tokens.spaceSp8,
		'padding-inline-start': tokens.spaceSp8,
	},
	action: {
		alignItems: 'center',
		appearance: 'none',
		backgroundColor: 'transparent',
		borderColor: 'transparent',
		borderStyle: 'none',
		borderWidth: 0,
		borderRadius: tokens.radiusDetail,
		boxShadow: 'none',
		color: tokens.colorTextSecondary,
		cursor: 'pointer',
		display: 'inline-flex',
		flexShrink: 0,
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: 'inherit',
		justifyContent: 'center',
		'min-block-size': tokens.controlSizeMinTarget,
		'min-inline-size': tokens.controlSizeMinTarget,
		// The invalid `::after` icon on `inputGroup` is its last DOM child. An explicit `order`
		// moves these actions behind the icon (default `order: 0`) without touching document order.
		order: 1,
		transform: 'none',
		transitionDuration: tokens.motionDurationFeedback,
		transitionProperty: 'background-color, color',
		transitionTimingFunction: tokens.motionEasingStandard,
		'[data-disabled="true"]': {
			cursor: 'not-allowed',
		},
		'[data-hovered="true"]:not([data-disabled="true"])': {
			backgroundColor: tokens.colorBackgroundAccentSubtleHover,
			color: tokens.colorTextPrimary,
		},
		'[data-pressed="true"]:not([data-disabled="true"])': {
			backgroundColor: tokens.colorBackgroundAccentSubtlePressed,
			color: tokens.colorTextPrimary,
		},
		':is([data-disabled="true"] *, [aria-disabled="true"] *)': {
			color: tokens.colorTextDisabled,
		},
		'@media (forced-colors: active)': {
			backgroundColor: 'ButtonFace',
			boxShadow: 'none',
			color: 'ButtonText',
			forcedColorAdjust: 'auto',
			'[data-disabled="true"]': {
				color: 'GrayText',
				opacity: 1,
			},
			'[data-hovered="true"]:not([data-disabled="true"]):not([aria-disabled="true"])': {
				backgroundColor: 'Highlight',
				boxShadow: 'none',
				color: 'HighlightText',
				outlineColor: 'Highlight',
				transform: 'none',
			},
			'[data-pressed="true"]:not([data-disabled="true"]):not([aria-disabled="true"])': {
				backgroundColor: 'Highlight',
				boxShadow: 'none',
				color: 'HighlightText',
				outlineColor: 'Highlight',
				transform: 'none',
			},
		},
		'@media (prefers-reduced-motion: reduce)': {
			transform: 'none',
			transitionDuration: '0s',
			transitionProperty: 'none',
		},
	},
	actionSizeMedium: {
		'block-size': tokens.controlSizeComboboxAction,
		'inline-size': tokens.controlSizeComboboxAction,
		'padding-inline-end': 0,
		'padding-inline-start': 0,
	},
	actionSizeSmall: {
		'block-size': tokens.controlSizeMinTarget,
		'inline-size': tokens.controlSizeMinTarget,
		'padding-inline-end': 0,
		'padding-inline-start': 0,
	},
	triggerSizeMedium: {
		'block-size': tokens.controlSizeComboboxAction,
		'inline-size': tokens.controlSizeComboboxAction,
		'margin-inline-end': tokens.spaceSp4,
		'margin-inline-start': tokens.spaceSp4,
		'padding-inline-end': 0,
		'padding-inline-start': 0,
	},
	triggerSizeSmall: {
		'block-size': tokens.controlSizeMinTarget,
		'inline-size': tokens.controlSizeMinTarget,
		'margin-inline-end': tokens.spaceSp4,
		'margin-inline-start': tokens.spaceSp4,
		'padding-inline-end': 0,
		'padding-inline-start': 0,
	},
	itemCheck: {
		flexShrink: 0,
		'margin-inline-start': 'auto',
	},
	popover: {
		backgroundColor: tokens.colorSurfaceFloating,
		borderColor: tokens.colorBorderDecorative,
		borderRadius: tokens.radiusSurface,
		borderStyle: 'solid',
		borderWidth: '1px',
		boxShadow: tokens.depthFloating,
		display: 'flex',
		flexDirection: 'column',
		'inline-size': 'var(--trigger-width)',
		isolation: 'isolate',
		'min-inline-size': 'var(--trigger-width)',
		overflow: 'hidden',
		transitionDuration: tokens.motionDurationEnter,
		transitionProperty: 'opacity, translate, box-shadow',
		transitionTimingFunction: tokens.motionEasingStandard,
		'[data-entering]': {
			opacity: 0,
		},
		'[data-exiting]': {
			opacity: 0,
			transitionDuration: tokens.motionDurationExit,
			transitionTimingFunction: tokens.motionEasingExit,
		},
		'@media (forced-colors: active)': {
			backgroundColor: 'Canvas',
			borderColor: 'CanvasText',
			boxShadow: 'none',
			forcedColorAdjust: 'auto',
		},
		'@media (prefers-reduced-motion: reduce)': {
			transitionDuration: '0s',
			transitionProperty: 'none',
			'[data-entering]': {
				opacity: 1,
				transitionDuration: '0s',
				transitionProperty: 'none',
				translate: 'none',
			},
			'[data-exiting]': {
				opacity: 1,
				transitionDuration: '0s',
				transitionProperty: 'none',
				translate: 'none',
			},
		},
		'@supports (min-block-size: calc-size(fit-content, size))': {
			'min-block-size': 'calc-size(fit-content, min(size, 12em))',
		},
	},
	listBox: {
		boxSizing: 'border-box',
		flex: 1,
		'inline-size': '100%',
		listStyle: 'none',
		margin: 0,
		'max-block-size': '18.75rem',
		'min-block-size': 0,
		outlineColor: 'transparent',
		outlineStyle: 'none',
		outlineWidth: 0,
		overflow: 'auto',
		padding: tokens.spaceSp4,
	},
	loadMoreItem: {
		alignItems: 'center',
		color: tokens.colorTextSecondary,
		display: 'flex',
		'inline-size': '100%',
		justifyContent: 'center',
		'min-inline-size': 0,
	},
	loadMoreItemSizeMedium: {
		'min-block-size': tokens.controlSizeMedium,
		'padding-block-end': tokens.spaceSp8,
		'padding-block-start': tokens.spaceSp8,
		'padding-inline-end': tokens.spaceSp12,
		'padding-inline-start': tokens.spaceSp12,
	},
	loadMoreItemSizeSmall: {
		'min-block-size': tokens.controlSizeSmall,
		'padding-block-end': tokens.spaceSp4,
		'padding-block-start': tokens.spaceSp4,
		'padding-inline-end': tokens.spaceSp8,
		'padding-inline-start': tokens.spaceSp8,
	},
	section: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spaceSp4,
		'padding-block-end': tokens.spaceSp8,
		'padding-block-start': tokens.spaceSp8,
	},
	sectionHeading: {
		color: tokens.colorTextSecondary,
		fontFamily: tokens.fontLabelFontFamily,
		fontSize: tokens.fontLabelFontSize,
		fontWeight: tokens.fontLabelFontWeight,
		letterSpacing: tokens.fontLabelLetterSpacing,
		lineHeight: tokens.fontLabelLineHeight,
		'padding-block-end': tokens.spaceSp4,
		'padding-block-start': 0,
		'padding-inline-end': tokens.spaceSp12,
		'padding-inline-start': tokens.spaceSp12,
	},
	emptyState: {
		alignItems: 'center',
		color: tokens.colorTextSecondary,
		display: 'flex',
		fontFamily: tokens.fontLabelFontFamily,
		fontSize: tokens.fontLabelFontSize,
		fontWeight: tokens.fontLabelFontWeight,
		justifyContent: 'center',
		letterSpacing: tokens.fontLabelLetterSpacing,
		lineHeight: tokens.fontLabelLineHeight,
		'padding-block-end': tokens.spaceSp24,
		'padding-block-start': tokens.spaceSp24,
		'padding-inline-end': tokens.spaceSp12,
		'padding-inline-start': tokens.spaceSp12,
		textAlign: 'center',
	},
	item: {
		alignItems: 'center',
		backgroundColor: 'transparent',
		borderRadius: tokens.radiusControl,
		color: tokens.colorTextPrimary,
		cursor: 'default',
		display: 'flex',
		gap: tokens.spaceSp8,
		'inline-size': '100%',
		'min-block-size': tokens.controlSizeMinTarget,
		'min-inline-size': 0,
		outlineColor: 'transparent',
		outlineStyle: 'none',
		outlineWidth: 0,
		transform: 'none',
		transitionDuration: tokens.motionDurationFeedback,
		transitionProperty: 'background-color, color, opacity',
		transitionTimingFunction: tokens.motionEasingStandard,
		'[data-disabled="true"]': {
			color: tokens.colorTextDisabled,
			cursor: 'not-allowed',
			opacity: tokens.interactionDisabledOpacity,
		},
		'[data-focused="true"]:not([data-disabled="true"]):not([data-selected="true"])': {
			backgroundColor: tokens.colorBackgroundNeutralSubtleRest,
		},
		'[data-hovered="true"]:not([data-disabled="true"]):not([data-selected="true"])': {
			backgroundColor: tokens.colorBackgroundNeutralSubtleHover,
		},
		'[data-pressed="true"]:not([data-disabled="true"]):not([data-selected="true"])': {
			backgroundColor: tokens.colorBackgroundNeutralSubtlePressed,
		},
		'[data-focus-visible="true"]:not([data-disabled="true"])': {
			backgroundColor: tokens.colorBackgroundAccentSubtleHover,
		},
		'[data-selected="true"]:not([data-disabled="true"])': {
			backgroundColor: tokens.colorBackgroundAccentSubtleRest,
			fontWeight: tokens.fontWeightLabel,
		},
		'[data-hovered="true"][data-selected="true"]:not([data-disabled="true"])': {
			backgroundColor: tokens.colorBackgroundAccentSubtleHover,
		},
		'[data-pressed="true"][data-selected="true"]:not([data-disabled="true"])': {
			backgroundColor: tokens.colorBackgroundAccentSubtlePressed,
		},
		'[data-selected="true"][data-focus-visible="true"]:not([data-disabled="true"])': {
			backgroundColor: tokens.colorBackgroundAccentSubtlePressed,
		},
		'@media (forced-colors: active)': {
			forcedColorAdjust: 'auto',
			'[data-disabled="true"]': {
				color: 'GrayText',
				opacity: 1,
			},
			'[data-focus-visible="true"]': {
				outlineColor: 'Highlight',
				outlineOffset: '-2px',
				outlineStyle: 'solid',
				outlineWidth: '2px',
			},
			'[data-selected="true"]:not([data-disabled="true"]):not([data-focus-visible="true"])': {
				backgroundColor: 'Highlight',
				color: 'HighlightText',
			},
		},
		'@media (prefers-reduced-motion: reduce)': {
			transform: 'none',
			transitionDuration: '0s',
			transitionProperty: 'none',
		},
	},
	itemSizeMedium: {
		fontFamily: tokens.fontLabelFontFamily,
		fontSize: tokens.fontLabelFontSize,
		fontWeight: tokens.fontWeightBody,
		letterSpacing: tokens.fontLabelLetterSpacing,
		lineHeight: tokens.fontLabelLineHeight,
		'min-block-size': tokens.controlSizeMedium,
		'padding-block-end': tokens.spaceSp8,
		'padding-block-start': tokens.spaceSp8,
		'padding-inline-end': tokens.spaceSp12,
		'padding-inline-start': tokens.spaceSp12,
	},
	itemSizeSmall: {
		fontFamily: tokens.fontLabelFontFamily,
		fontSize: tokens.fontLabelFontSize,
		fontWeight: tokens.fontWeightBody,
		letterSpacing: tokens.fontLabelLetterSpacing,
		lineHeight: tokens.fontLabelLineHeight,
		'min-block-size': tokens.controlSizeSmall,
		'padding-block-end': tokens.spaceSp4,
		'padding-block-start': tokens.spaceSp4,
		'padding-inline-end': tokens.spaceSp12,
		'padding-inline-start': tokens.spaceSp12,
	},
	mobileInputGroup: {
		flexShrink: 0,
		'inline-size': 'auto',
		'margin-block-end': tokens.spaceSp12,
		'margin-block-start': tokens.spaceSp12,
		'margin-inline-end': tokens.spaceSp12,
		'margin-inline-start': tokens.spaceSp12,
	},
	mobileListBox: {
		'max-block-size': 'none',
		overscrollBehavior: 'contain',
	},
	mobileTrigger: {
		alignItems: 'center',
		'block-size': '100%',
		color: tokens.colorTextPrimary,
		display: 'flex',
		'inline-size': '100%',
		justifyContent: 'space-between',
		'margin-inline-end': 0,
		'margin-inline-start': 0,
		'min-inline-size': 'calc(20ch + var(--luke-control-size-combobox-action))',
	},
	mobileTriggerSizeMedium: {
		'padding-inline-end': tokens.spaceSp12,
		'padding-inline-start': tokens.spaceSp12,
	},
	mobileTriggerSizeSmall: {
		'padding-inline-end': tokens.spaceSp8,
		'padding-inline-start': tokens.spaceSp8,
	},
	mobileValue: {
		flex: 1,
		'min-inline-size': 0,
		overflow: 'hidden',
		textAlign: 'start',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
});

/**
 * Slotted recipe for the combobox anatomy. Internal — not exported from a public entrypoint.
 *
 * `comboboxRecipe({ size }).root() / .inputGroup() / …`.
 */
export const { recipe: comboboxRecipe, resolveStyles: resolveComboboxRecipeStyles } =
	createSlottedRecipe({
		defaultVariants: {
			size: 'medium',
		},
		slots: {
			root: styles.root,
			inputGroup: styles.inputGroup,
			textInput: styles.textInput,
			trigger: styles.action,
			clearButton: styles.action,
			itemCheck: styles.itemCheck,
			popover: styles.popover,
			listBox: styles.listBox,
			loadMoreItem: styles.loadMoreItem,
			section: styles.section,
			sectionHeading: styles.sectionHeading,
			emptyState: styles.emptyState,
			item: styles.item,
			mobileInputGroup: styles.mobileInputGroup,
			mobileListBox: styles.mobileListBox,
			mobileTrigger: styles.mobileTrigger,
			mobileValue: styles.mobileValue,
		},
		variants: {
			size: {
				medium: {
					inputGroup: styles.inputGroupSizeMedium,
					textInput: styles.textInputSizeMedium,
					trigger: styles.triggerSizeMedium,
					clearButton: styles.actionSizeMedium,
					loadMoreItem: styles.loadMoreItemSizeMedium,
					mobileTrigger: styles.mobileTriggerSizeMedium,
					item: styles.itemSizeMedium,
				},
				small: {
					inputGroup: styles.inputGroupSizeSmall,
					textInput: styles.textInputSizeSmall,
					trigger: styles.triggerSizeSmall,
					clearButton: styles.actionSizeSmall,
					loadMoreItem: styles.loadMoreItemSizeSmall,
					mobileTrigger: styles.mobileTriggerSizeSmall,
					item: styles.itemSizeSmall,
				},
			},
		},
	});

/** Allowed `size` values for the combobox recipe. */
export type ComboboxSize = NonNullable<RecipeSelection<typeof comboboxRecipe>['size']>;
