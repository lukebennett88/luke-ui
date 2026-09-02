import * as stylex from '@stylexjs/stylex';
import { vars } from '../../../theme/tokens.stylex.js';
import { comboboxInputStates } from '../../styles/input-states.js';
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
	backgroundColor: vars.colorForegroundDangerRest,
	'block-size': 'var(--luke-combobox-error-icon-size)',
	content: "''",
	flexShrink: 0,
	'inline-size': 'var(--luke-combobox-error-icon-size)',
	'margin-inline-end': vars.spaceSp4,
	maskImage: invalidIndicator.maskImage,
	maskPosition: 'center',
	maskRepeat: 'no-repeat',
	maskSize: 'contain',
} as const;

/**
 * The disabled / hover / focus-within / invalid / read-only state styling on `inputGroup` lives in
 * `../../styles/input-states.ts`, shared with the sibling `InputGroup` recipe — see that module's
 * block comment for why StyleX forced this into its own module rather than a plain shared helper,
 * and for the one intentional difference (`Combobox` narrows focus-within to `:has(input:focus)`,
 * because its anatomy puts a trigger and clear button inside the group).
 *
 * The in-control invalid `::after` icon stays local, below: it is Combobox's own anatomy, not a
 * state InputGroup shares, so it composes as a second style keyed on the same invalid selectors.
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
		backgroundColor: vars.colorSurfaceRecessed,
		borderColor: vars.colorBorderControl,
		borderRadius: vars.radiusControl,
		borderStyle: 'solid',
		borderWidth: '1px',
		boxShadow: vars.depthRecessed,
		color: vars.colorTextPrimary,
		cursor: 'text',
		display: 'inline-flex',
		fontFamily: vars.fontFamilyBody,
		'inline-size': '100%',
		isolation: 'isolate',
		letterSpacing: '0',
		lineHeight: '24px',
		'min-inline-size': 0,
		outlineColor: 'transparent',
		outlineStyle: 'none',
		outlineWidth: 0,
		overflow: 'visible',
		transitionDuration: vars.motionDurationFeedback,
		transitionProperty: 'background-color, border-color, color',
		transitionTimingFunction: vars.motionEasingStandard,
		'@media (prefers-reduced-motion: reduce)': {
			transitionDuration: '0s',
			transitionProperty: 'none',
		},
	},
	/**
	 * The in-control invalid `::after` icon, added on top of `input-states.ts`'s shared invalid
	 * state. Kept separate so the icon's light/forced-colors treatment sits next to the icon
	 * definition, not interleaved with the state matrix that now lives in the shared module.
	 */
	inputGroupInvalidIcon: {
		':where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within):has(input:focus)):not(:where([data-readonly="true"], :has(input:read-only)))':
			{
				'::after': invalidIndicatorIcon,
			},
		':where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])):where([data-focus-within="true"], :focus-within):has(input:focus):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-readonly="true"], :has(input:read-only)))':
			{
				'::after': invalidIndicatorIcon,
			},
		'@media (forced-colors: active)': {
			':where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within):has(input:focus)):not(:where([data-readonly="true"], :has(input:read-only)))':
				{
					'::after': {
						backgroundColor: invalidIndicator.forcedColorsBackgroundColor,
					},
				},
			':where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])):where([data-focus-within="true"], :focus-within):has(input:focus):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-readonly="true"], :has(input:read-only)))':
				{
					'::after': {
						backgroundColor: invalidIndicator.forcedColorsBackgroundColor,
					},
				},
		},
	},
	inputGroupSizeMedium: {
		'--luke-combobox-error-icon-size': vars.iconSizeSmall,
		'block-size': vars.controlSizeMedium,
		fontSize: '16px',
	},
	inputGroupSizeSmall: {
		'--luke-combobox-error-icon-size': vars.iconSizeXsmall,
		'block-size': vars.controlSizeSmall,
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
	textInputSizeMedium: {
		'block-size': vars.controlSizeMedium,
		'padding-inline-end': vars.spaceSp12,
		'padding-inline-start': vars.spaceSp12,
	},
	textInputSizeSmall: {
		'block-size': vars.controlSizeSmall,
		'padding-inline-end': vars.spaceSp8,
		'padding-inline-start': vars.spaceSp8,
	},
	action: {
		alignItems: 'center',
		appearance: 'none',
		backgroundColor: 'transparent',
		borderColor: 'transparent',
		borderStyle: 'none',
		borderWidth: 0,
		borderRadius: vars.radiusDetail,
		boxShadow: 'none',
		color: vars.colorTextSecondary,
		cursor: 'pointer',
		display: 'inline-flex',
		flexShrink: 0,
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: 'inherit',
		justifyContent: 'center',
		'min-block-size': vars.controlSizeMinTarget,
		'min-inline-size': vars.controlSizeMinTarget,
		// The invalid `::after` icon on `inputGroup` is its last DOM child. An explicit `order`
		// moves these actions behind the icon (default `order: 0`) without touching document order.
		order: 1,
		transform: 'none',
		transitionDuration: vars.motionDurationFeedback,
		transitionProperty: 'background-color, color',
		transitionTimingFunction: vars.motionEasingStandard,
		'[data-disabled="true"]': {
			cursor: 'not-allowed',
		},
		'[data-hovered="true"]:not([data-disabled="true"])': {
			backgroundColor: vars.colorBackgroundAccentSubtleHover,
			color: vars.colorTextPrimary,
		},
		'[data-pressed="true"]:not([data-disabled="true"])': {
			backgroundColor: vars.colorBackgroundAccentSubtlePressed,
			color: vars.colorTextPrimary,
		},
		':is([data-disabled="true"] *, [aria-disabled="true"] *)': {
			color: vars.colorTextDisabled,
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
		'block-size': vars.controlSizeComboboxAction,
		'inline-size': vars.controlSizeComboboxAction,
		'padding-inline-end': 0,
		'padding-inline-start': 0,
	},
	actionSizeSmall: {
		'block-size': vars.controlSizeMinTarget,
		'inline-size': vars.controlSizeMinTarget,
		'padding-inline-end': 0,
		'padding-inline-start': 0,
	},
	triggerSizeMedium: {
		'block-size': vars.controlSizeComboboxAction,
		'inline-size': vars.controlSizeComboboxAction,
		'margin-inline-end': vars.spaceSp4,
		'margin-inline-start': vars.spaceSp4,
		'padding-inline-end': 0,
		'padding-inline-start': 0,
	},
	triggerSizeSmall: {
		'block-size': vars.controlSizeMinTarget,
		'inline-size': vars.controlSizeMinTarget,
		'margin-inline-end': vars.spaceSp4,
		'margin-inline-start': vars.spaceSp4,
		'padding-inline-end': 0,
		'padding-inline-start': 0,
	},
	itemCheck: {
		flexShrink: 0,
		'margin-inline-start': 'auto',
	},
	popover: {
		backgroundColor: vars.colorSurfaceFloating,
		borderColor: vars.colorBorderDecorative,
		borderRadius: vars.radiusSurface,
		borderStyle: 'solid',
		borderWidth: '1px',
		boxShadow: vars.depthFloating,
		display: 'flex',
		flexDirection: 'column',
		'inline-size': 'var(--trigger-width)',
		isolation: 'isolate',
		'min-inline-size': 'var(--trigger-width)',
		overflow: 'hidden',
		transitionDuration: vars.motionDurationEnter,
		transitionProperty: 'opacity, translate, box-shadow',
		transitionTimingFunction: vars.motionEasingStandard,
		'[data-entering]': {
			opacity: 0,
		},
		'[data-exiting]': {
			opacity: 0,
			transitionDuration: vars.motionDurationExit,
			transitionTimingFunction: vars.motionEasingExit,
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
		padding: vars.spaceSp4,
	},
	loadMoreItem: {
		alignItems: 'center',
		color: vars.colorTextSecondary,
		display: 'flex',
		'inline-size': '100%',
		justifyContent: 'center',
		'min-inline-size': 0,
	},
	loadMoreItemSizeMedium: {
		'min-block-size': vars.controlSizeMedium,
		'padding-block-end': vars.spaceSp8,
		'padding-block-start': vars.spaceSp8,
		'padding-inline-end': vars.spaceSp12,
		'padding-inline-start': vars.spaceSp12,
	},
	loadMoreItemSizeSmall: {
		'min-block-size': vars.controlSizeSmall,
		'padding-block-end': vars.spaceSp4,
		'padding-block-start': vars.spaceSp4,
		'padding-inline-end': vars.spaceSp8,
		'padding-inline-start': vars.spaceSp8,
	},
	section: {
		display: 'flex',
		flexDirection: 'column',
		gap: vars.spaceSp4,
		'padding-block-end': vars.spaceSp8,
		'padding-block-start': vars.spaceSp8,
	},
	sectionHeading: {
		color: vars.colorTextSecondary,
		fontFamily: vars.fontLabelFontFamily,
		fontSize: vars.fontLabelFontSize,
		fontWeight: vars.fontLabelFontWeight,
		letterSpacing: vars.fontLabelLetterSpacing,
		lineHeight: vars.fontLabelLineHeight,
		'padding-block-end': vars.spaceSp4,
		'padding-block-start': 0,
		'padding-inline-end': vars.spaceSp12,
		'padding-inline-start': vars.spaceSp12,
	},
	emptyState: {
		alignItems: 'center',
		color: vars.colorTextSecondary,
		display: 'flex',
		fontFamily: vars.fontLabelFontFamily,
		fontSize: vars.fontLabelFontSize,
		fontWeight: vars.fontLabelFontWeight,
		justifyContent: 'center',
		letterSpacing: vars.fontLabelLetterSpacing,
		lineHeight: vars.fontLabelLineHeight,
		'padding-block-end': vars.spaceSp24,
		'padding-block-start': vars.spaceSp24,
		'padding-inline-end': vars.spaceSp12,
		'padding-inline-start': vars.spaceSp12,
		textAlign: 'center',
	},
	item: {
		alignItems: 'center',
		backgroundColor: 'transparent',
		borderRadius: vars.radiusControl,
		color: vars.colorTextPrimary,
		cursor: 'default',
		display: 'flex',
		gap: vars.spaceSp8,
		'inline-size': '100%',
		'min-block-size': vars.controlSizeMinTarget,
		'min-inline-size': 0,
		outlineColor: 'transparent',
		outlineStyle: 'none',
		outlineWidth: 0,
		transform: 'none',
		transitionDuration: vars.motionDurationFeedback,
		transitionProperty: 'background-color, color, opacity',
		transitionTimingFunction: vars.motionEasingStandard,
		'[data-disabled="true"]': {
			color: vars.colorTextDisabled,
			cursor: 'not-allowed',
			opacity: vars.interactionDisabledOpacity,
		},
		'[data-focused="true"]:not([data-disabled="true"]):not([data-selected="true"])': {
			backgroundColor: vars.colorBackgroundNeutralSubtleRest,
		},
		'[data-hovered="true"]:not([data-disabled="true"]):not([data-selected="true"])': {
			backgroundColor: vars.colorBackgroundNeutralSubtleHover,
		},
		'[data-pressed="true"]:not([data-disabled="true"]):not([data-selected="true"])': {
			backgroundColor: vars.colorBackgroundNeutralSubtlePressed,
		},
		'[data-focus-visible="true"]:not([data-disabled="true"])': {
			backgroundColor: vars.colorBackgroundAccentSubtleHover,
		},
		'[data-selected="true"]:not([data-disabled="true"])': {
			backgroundColor: vars.colorBackgroundAccentSubtleRest,
			fontWeight: vars.fontWeightLabel,
		},
		'[data-hovered="true"][data-selected="true"]:not([data-disabled="true"])': {
			backgroundColor: vars.colorBackgroundAccentSubtleHover,
		},
		'[data-pressed="true"][data-selected="true"]:not([data-disabled="true"])': {
			backgroundColor: vars.colorBackgroundAccentSubtlePressed,
		},
		'[data-selected="true"][data-focus-visible="true"]:not([data-disabled="true"])': {
			backgroundColor: vars.colorBackgroundAccentSubtlePressed,
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
		fontFamily: vars.fontLabelFontFamily,
		fontSize: vars.fontLabelFontSize,
		fontWeight: vars.fontWeightBody,
		letterSpacing: vars.fontLabelLetterSpacing,
		lineHeight: vars.fontLabelLineHeight,
		'min-block-size': vars.controlSizeMedium,
		'padding-block-end': vars.spaceSp8,
		'padding-block-start': vars.spaceSp8,
		'padding-inline-end': vars.spaceSp12,
		'padding-inline-start': vars.spaceSp12,
	},
	itemSizeSmall: {
		fontFamily: vars.fontLabelFontFamily,
		fontSize: vars.fontLabelFontSize,
		fontWeight: vars.fontWeightBody,
		letterSpacing: vars.fontLabelLetterSpacing,
		lineHeight: vars.fontLabelLineHeight,
		'min-block-size': vars.controlSizeSmall,
		'padding-block-end': vars.spaceSp4,
		'padding-block-start': vars.spaceSp4,
		'padding-inline-end': vars.spaceSp12,
		'padding-inline-start': vars.spaceSp12,
	},
	mobileInputGroup: {
		flexShrink: 0,
		'inline-size': 'auto',
		'margin-block-end': vars.spaceSp12,
		'margin-block-start': vars.spaceSp12,
		'margin-inline-end': vars.spaceSp12,
		'margin-inline-start': vars.spaceSp12,
	},
	mobileListBox: {
		'max-block-size': 'none',
		overscrollBehavior: 'contain',
	},
	mobileTrigger: {
		alignItems: 'center',
		'block-size': '100%',
		color: vars.colorTextPrimary,
		display: 'flex',
		'inline-size': '100%',
		justifyContent: 'space-between',
		'margin-inline-end': 0,
		'margin-inline-start': 0,
		'min-inline-size': 'calc(20ch + var(--luke-control-size-combobox-action))',
	},
	mobileTriggerSizeMedium: {
		'padding-inline-end': vars.spaceSp12,
		'padding-inline-start': vars.spaceSp12,
	},
	mobileTriggerSizeSmall: {
		'padding-inline-end': vars.spaceSp8,
		'padding-inline-start': vars.spaceSp8,
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
export const [comboboxRecipe, resolveComboboxRecipeSlotStyles] = createSlottedRecipe({
	defaultVariants: {
		size: 'medium',
	},
	slots: {
		root: styles.root,
		inputGroup: [styles.inputGroup, ...comboboxInputStates, styles.inputGroupInvalidIcon],
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
