import * as stylex from '@stylexjs/stylex';
import { fontMetrics } from '../../../theme/font-metric-scale.stylex.js';
import { vars } from '../../../theme/tokens.stylex.js';
import { comboboxInputStates } from '../../styles/input-states.js';
import { invalidIndicator } from '../../styles/invalid-indicator.stylex.js';
import type { SlotRecipeSelection } from '../../styles/stylex-recipe.js';
import { createSlottedRecipe, createSlottedRecipeStyles } from '../../styles/stylex-recipe.js';

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
	backgroundColor: vars.color.foreground.danger.rest,
	blockSize: 'var(--luke-combobox-error-icon-size)',
	content: "''",
	flexShrink: 0,
	inlineSize: 'var(--luke-combobox-error-icon-size)',
	marginInlineEnd: vars.space.sp4,
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
		inlineSize: '100%',
		minInlineSize: 0,
	},
	inputGroup: {
		alignItems: 'center',
		backgroundColor: vars.color.surface.recessed,
		borderColor: vars.color.border.control,
		borderRadius: vars.radius.control,
		borderStyle: 'solid',
		borderWidth: '1px',
		boxShadow: vars.depth.recessed,
		color: vars.color.text.primary,
		cursor: 'text',
		display: 'inline-flex',
		fontFamily: vars.font.family.body,
		inlineSize: '100%',
		isolation: 'isolate',
		letterSpacing: fontMetrics.step16.letterSpacing,
		lineHeight: fontMetrics.step16.lineHeight,
		minInlineSize: 0,
		outlineColor: 'transparent',
		outlineStyle: 'none',
		outlineWidth: 0,
		overflow: 'visible',
		transitionDuration: vars.motion.duration.feedback,
		transitionProperty: 'background-color, border-color, color',
		transitionTimingFunction: vars.motion.easing.standard,
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
		'--luke-combobox-error-icon-size': vars.iconSize.small,
		blockSize: vars.controlSize.medium,
		fontSize: fontMetrics.step16.fontSize,
	},
	inputGroupSizeSmall: {
		'--luke-combobox-error-icon-size': vars.iconSize.xsmall,
		blockSize: vars.controlSize.small,
		fontSize: fontMetrics.step14.fontSize,
		letterSpacing: fontMetrics.step14.letterSpacing,
		lineHeight: fontMetrics.step14.lineHeight,
	},
	textInput: {
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
	textInputSizeMedium: {
		blockSize: vars.controlSize.medium,
		paddingInlineEnd: vars.space.sp12,
		paddingInlineStart: vars.space.sp12,
	},
	textInputSizeSmall: {
		blockSize: vars.controlSize.small,
		paddingInlineEnd: vars.space.sp8,
		paddingInlineStart: vars.space.sp8,
	},
	action: {
		alignItems: 'center',
		appearance: 'none',
		backgroundColor: 'transparent',
		borderColor: 'transparent',
		borderStyle: 'none',
		borderWidth: 0,
		borderRadius: vars.radius.detail,
		boxShadow: 'none',
		color: vars.color.text.secondary,
		cursor: 'pointer',
		display: 'inline-flex',
		flexShrink: 0,
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: 'inherit',
		justifyContent: 'center',
		minBlockSize: vars.controlSize.minTarget,
		minInlineSize: vars.controlSize.minTarget,
		// The invalid `::after` icon on `inputGroup` is its last DOM child. An explicit `order`
		// moves these actions behind the icon (default `order: 0`) without touching document order.
		order: 1,
		transform: 'none',
		transitionDuration: vars.motion.duration.feedback,
		transitionProperty: 'background-color, color',
		transitionTimingFunction: vars.motion.easing.standard,
		'[data-disabled="true"]': {
			cursor: 'not-allowed',
		},
		'[data-hovered="true"]:not([data-disabled="true"])': {
			backgroundColor: vars.color.background.accent.subtle.hover,
			color: vars.color.text.primary,
		},
		'[data-pressed="true"]:not([data-disabled="true"])': {
			backgroundColor: vars.color.background.accent.subtle.pressed,
			color: vars.color.text.primary,
		},
		':is([data-disabled="true"] *, [aria-disabled="true"] *)': {
			color: vars.color.text.disabled,
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
		blockSize: vars.controlSize.comboboxAction,
		inlineSize: vars.controlSize.comboboxAction,
		paddingInlineEnd: 0,
		paddingInlineStart: 0,
	},
	actionSizeSmall: {
		blockSize: vars.controlSize.minTarget,
		inlineSize: vars.controlSize.minTarget,
		paddingInlineEnd: 0,
		paddingInlineStart: 0,
	},
	triggerSizeMedium: {
		blockSize: vars.controlSize.comboboxAction,
		inlineSize: vars.controlSize.comboboxAction,
		marginInlineEnd: vars.space.sp4,
		marginInlineStart: vars.space.sp4,
		paddingInlineEnd: 0,
		paddingInlineStart: 0,
	},
	triggerSizeSmall: {
		blockSize: vars.controlSize.minTarget,
		inlineSize: vars.controlSize.minTarget,
		marginInlineEnd: vars.space.sp4,
		marginInlineStart: vars.space.sp4,
		paddingInlineEnd: 0,
		paddingInlineStart: 0,
	},
	itemCheck: {
		flexShrink: 0,
		marginInlineStart: 'auto',
	},
	popover: {
		backgroundColor: vars.color.surface.floating,
		borderColor: vars.color.border.decorative,
		borderRadius: vars.radius.surface,
		borderStyle: 'solid',
		borderWidth: '1px',
		boxShadow: vars.depth.floating,
		display: 'flex',
		flexDirection: 'column',
		inlineSize: 'var(--trigger-width)',
		isolation: 'isolate',
		minInlineSize: 'var(--trigger-width)',
		overflow: 'hidden',
		transitionDuration: vars.motion.duration.enter,
		transitionProperty: 'opacity, translate, box-shadow',
		transitionTimingFunction: vars.motion.easing.standard,
		'[data-entering]': {
			opacity: 0,
		},
		'[data-exiting]': {
			opacity: 0,
			transitionDuration: vars.motion.duration.exit,
			transitionTimingFunction: vars.motion.easing.exit,
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
			minBlockSize: 'calc-size(fit-content, min(size, 12em))',
		},
	},
	listBox: {
		boxSizing: 'border-box',
		flex: 1,
		inlineSize: '100%',
		listStyle: 'none',
		margin: 0,
		maxBlockSize: '18.75rem',
		minBlockSize: 0,
		outlineColor: 'transparent',
		outlineStyle: 'none',
		outlineWidth: 0,
		overflow: 'auto',
		padding: vars.space.sp4,
	},
	loadMoreItem: {
		alignItems: 'center',
		color: vars.color.text.secondary,
		display: 'flex',
		inlineSize: '100%',
		justifyContent: 'center',
		minInlineSize: 0,
	},
	loadMoreItemSizeMedium: {
		minBlockSize: vars.controlSize.medium,
		paddingBlockEnd: vars.space.sp8,
		paddingBlockStart: vars.space.sp8,
		paddingInlineEnd: vars.space.sp12,
		paddingInlineStart: vars.space.sp12,
	},
	loadMoreItemSizeSmall: {
		minBlockSize: vars.controlSize.small,
		paddingBlockEnd: vars.space.sp4,
		paddingBlockStart: vars.space.sp4,
		paddingInlineEnd: vars.space.sp8,
		paddingInlineStart: vars.space.sp8,
	},
	section: {
		display: 'flex',
		flexDirection: 'column',
		gap: vars.space.sp4,
		paddingBlockEnd: vars.space.sp8,
		paddingBlockStart: vars.space.sp8,
	},
	sectionHeading: {
		color: vars.color.text.secondary,
		fontFamily: vars.font.label.fontFamily,
		fontSize: vars.font.label.fontSize,
		fontWeight: vars.font.label.fontWeight,
		letterSpacing: vars.font.label.letterSpacing,
		lineHeight: vars.font.label.lineHeight,
		paddingBlockEnd: vars.space.sp4,
		paddingBlockStart: 0,
		paddingInlineEnd: vars.space.sp12,
		paddingInlineStart: vars.space.sp12,
	},
	emptyState: {
		alignItems: 'center',
		color: vars.color.text.secondary,
		display: 'flex',
		fontFamily: vars.font.label.fontFamily,
		fontSize: vars.font.label.fontSize,
		fontWeight: vars.font.label.fontWeight,
		justifyContent: 'center',
		letterSpacing: vars.font.label.letterSpacing,
		lineHeight: vars.font.label.lineHeight,
		paddingBlockEnd: vars.space.sp24,
		paddingBlockStart: vars.space.sp24,
		paddingInlineEnd: vars.space.sp12,
		paddingInlineStart: vars.space.sp12,
		textAlign: 'center',
	},
	item: {
		alignItems: 'center',
		backgroundColor: 'transparent',
		borderRadius: vars.radius.control,
		color: vars.color.text.primary,
		cursor: 'default',
		display: 'flex',
		gap: vars.space.sp8,
		inlineSize: '100%',
		minBlockSize: vars.controlSize.minTarget,
		minInlineSize: 0,
		outlineColor: 'transparent',
		outlineStyle: 'none',
		outlineWidth: 0,
		transform: 'none',
		transitionDuration: vars.motion.duration.feedback,
		transitionProperty: 'background-color, color, opacity',
		transitionTimingFunction: vars.motion.easing.standard,
		'[data-disabled="true"]': {
			color: vars.color.text.disabled,
			cursor: 'not-allowed',
			opacity: vars.interaction.disabledOpacity,
		},
		'[data-focused="true"]:not([data-disabled="true"]):not([data-selected="true"])': {
			backgroundColor: vars.color.background.neutral.subtle.rest,
		},
		'[data-hovered="true"]:not([data-disabled="true"]):not([data-selected="true"])': {
			backgroundColor: vars.color.background.neutral.subtle.hover,
		},
		'[data-pressed="true"]:not([data-disabled="true"]):not([data-selected="true"])': {
			backgroundColor: vars.color.background.neutral.subtle.pressed,
		},
		'[data-focus-visible="true"]:not([data-disabled="true"])': {
			backgroundColor: vars.color.background.accent.subtle.hover,
		},
		'[data-selected="true"]:not([data-disabled="true"])': {
			backgroundColor: vars.color.background.accent.subtle.rest,
			fontWeight: vars.font.weight.label,
		},
		'[data-hovered="true"][data-selected="true"]:not([data-disabled="true"])': {
			backgroundColor: vars.color.background.accent.subtle.hover,
		},
		'[data-pressed="true"][data-selected="true"]:not([data-disabled="true"])': {
			backgroundColor: vars.color.background.accent.subtle.pressed,
		},
		'[data-selected="true"][data-focus-visible="true"]:not([data-disabled="true"])': {
			backgroundColor: vars.color.background.accent.subtle.pressed,
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
		fontFamily: vars.font.label.fontFamily,
		fontSize: vars.font.label.fontSize,
		fontWeight: vars.font.weight.body,
		letterSpacing: vars.font.label.letterSpacing,
		lineHeight: vars.font.label.lineHeight,
		minBlockSize: vars.controlSize.medium,
		paddingBlockEnd: vars.space.sp8,
		paddingBlockStart: vars.space.sp8,
		paddingInlineEnd: vars.space.sp12,
		paddingInlineStart: vars.space.sp12,
	},
	itemSizeSmall: {
		fontFamily: vars.font.label.fontFamily,
		fontSize: vars.font.label.fontSize,
		fontWeight: vars.font.weight.body,
		letterSpacing: vars.font.label.letterSpacing,
		lineHeight: vars.font.label.lineHeight,
		minBlockSize: vars.controlSize.small,
		paddingBlockEnd: vars.space.sp4,
		paddingBlockStart: vars.space.sp4,
		paddingInlineEnd: vars.space.sp12,
		paddingInlineStart: vars.space.sp12,
	},
	/**
	 * `inputGroup`'s tray presentation: the search field row inside the mobile tray, laid out with
	 * margins instead of filling the control the way the popover's `inputGroup` does.
	 */
	inputGroupPresentationTray: {
		flexShrink: 0,
		inlineSize: 'auto',
		marginBlockEnd: vars.space.sp12,
		marginBlockStart: vars.space.sp12,
		marginInlineEnd: vars.space.sp12,
		marginInlineStart: vars.space.sp12,
	},
	/** `listBox`'s tray presentation: fills the tray instead of capping at a popover's max height. */
	listBoxPresentationTray: {
		maxBlockSize: 'none',
		overscrollBehavior: 'contain',
	},
	/**
	 * The trigger control that opens the tray. A distinct structural role from `trigger` (the
	 * in-popover chevron button): it lives outside the tray, renders the combobox's current value,
	 * and is the only pressable surface in the mobile composition's trigger row.
	 */
	trayTrigger: {
		alignItems: 'center',
		blockSize: '100%',
		color: vars.color.text.primary,
		display: 'flex',
		inlineSize: '100%',
		justifyContent: 'space-between',
		marginInlineEnd: 0,
		marginInlineStart: 0,
		minInlineSize: 'calc(20ch + var(--luke-control-size-combobox-action))',
	},
	trayTriggerSizeMedium: {
		paddingInlineEnd: vars.space.sp12,
		paddingInlineStart: vars.space.sp12,
	},
	trayTriggerSizeSmall: {
		paddingInlineEnd: vars.space.sp8,
		paddingInlineStart: vars.space.sp8,
	},
	/** The current value rendered inside `trayTrigger`. No size dependency. */
	trayValue: {
		flex: 1,
		minInlineSize: 0,
		overflow: 'hidden',
		textAlign: 'start',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
});

const comboboxRecipeStyles = createSlottedRecipeStyles({
	defaultVariants: {
		presentation: 'popover',
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
		trayTrigger: styles.trayTrigger,
		trayValue: styles.trayValue,
	},
	variants: {
		presentation: {
			// `null` marks a valid variant value that contributes no style, rather than a fake
			// empty style object: the popover presentation is the recipe's unqualified base.
			popover: null,
			tray: {
				inputGroup: styles.inputGroupPresentationTray,
				listBox: styles.listBoxPresentationTray,
			},
		},
		size: {
			medium: {
				inputGroup: styles.inputGroupSizeMedium,
				textInput: styles.textInputSizeMedium,
				trigger: styles.triggerSizeMedium,
				clearButton: styles.actionSizeMedium,
				loadMoreItem: styles.loadMoreItemSizeMedium,
				trayTrigger: styles.trayTriggerSizeMedium,
				item: styles.itemSizeMedium,
			},
			small: {
				inputGroup: styles.inputGroupSizeSmall,
				textInput: styles.textInputSizeSmall,
				trigger: styles.triggerSizeSmall,
				clearButton: styles.actionSizeSmall,
				loadMoreItem: styles.loadMoreItemSizeSmall,
				trayTrigger: styles.trayTriggerSizeSmall,
				item: styles.itemSizeSmall,
			},
		},
	},
});

/** Canonical per-slot resolver for the combobox anatomy. */
export const resolveComboboxRecipeSlotStyles = comboboxRecipeStyles.resolveSlotStyles;

/**
 * Slotted recipe for the combobox anatomy. Internal — not exported from a public entrypoint.
 *
 * `comboboxRecipe({ size }).root / .inputGroup / …`.
 */
export const comboboxRecipe = createSlottedRecipe(comboboxRecipeStyles);

/** Allowed `size` values for the combobox recipe. */
export type ComboboxSize = NonNullable<
	SlotRecipeSelection<typeof resolveComboboxRecipeSlotStyles>['size']
>;
