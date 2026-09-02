import * as stylex from '@stylexjs/stylex';
import { tokens } from '../../../theme/tokens.stylex.js';
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
export const { recipe: comboboxRecipe, resolveSlotStyles: resolveComboboxRecipeSlotStyles } =
	createSlottedRecipe({
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
