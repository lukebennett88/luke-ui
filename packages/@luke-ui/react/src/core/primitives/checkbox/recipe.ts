import * as stylex from '@stylexjs/stylex';
import { fontMetrics } from '../../../theme/font-metric-scale.stylex.js';
import { vars } from '../../../theme/tokens.stylex.js';
import type { SlotRecipeSelection } from '../../styles/stylex-recipe.js';
import { createSlottedRecipe, createSlottedRecipeStyles } from '../../styles/stylex-recipe.js';

/**
 * Private custom properties private to this recipe, each set by a `root` size variant and read by
 * `control`/`indicator`. Module-local: StyleX's static analysis requires custom-property names
 * used as object keys to resolve within the same module, so an imported constant does not compile
 * here.
 */
const checkboxControlSize = '--checkbox-control-size';
const checkboxIndicatorSize = '--checkbox-indicator-size';
const checkboxGlyphSize = '--checkbox-glyph-size';

const styles = stylex.create({
	content: {
		alignItems: 'flex-start',
		color: 'inherit',
		cursor: 'pointer',
		display: 'inline-flex',
		font: 'inherit',
		gap: vars.space.sp8,
		minInlineSize: 0,
		'[data-disabled="true"]': {
			color: vars.color.text.disabled,
			cursor: 'not-allowed',
		},
		// The reset default ring would otherwise paint both this clickable row and the
		// indicator box; the box alone carries the focus indication (see `indicator`).
		'[data-focus-visible="true"]': {
			outline: 'none',
		},
		'[data-readonly="true"]:not([data-disabled="true"])': {
			cursor: 'default',
		},
	},
	control: {
		alignItems: 'center',
		blockSize: 'var(--text-line-height, 1lh)',
		display: 'inline-flex',
		flexShrink: 0,
		inlineSize: `var(${checkboxControlSize})`,
		justifyContent: 'center',
	},
	indicator: {
		alignItems: 'center',
		backgroundColor: vars.color.surface.canvas,
		backgroundImage: vars.actionControlFinish.resting,
		blockSize: `var(${checkboxIndicatorSize})`,
		borderColor: vars.color.border.control,
		borderRadius: vars.radius.detail,
		borderStyle: 'solid',
		borderWidth: '1px',
		boxShadow: 'none',
		boxSizing: 'border-box',
		color: vars.color.foreground.accent.onSolid,
		display: 'inline-flex',
		fontSize: `var(${checkboxGlyphSize})`,
		fontWeight: vars.font.weight.heading,
		inlineSize: `var(${checkboxIndicatorSize})`,
		justifyContent: 'center',
		lineHeight: 1,
		transitionDuration: vars.motion.duration.feedback,
		transitionProperty: 'background-color, background-image, border-color, color, opacity',
		transitionTimingFunction: vars.motion.easing.standard,
		'::after': {
			content: '"✓"',
			opacity: 0,
		},
		':is([data-focus-visible="true"] *)': {
			outlineColor: vars.color.border.focus,
			outlineOffset: '2px',
			outlineStyle: 'solid',
			outlineWidth: '2px',
		},
		':is([data-indeterminate="true"] *)': {
			'::after': {
				content: '"−"',
				opacity: 1,
			},
		},
		':is([data-selected="true"] *):not(:is([data-indeterminate="true"] *))': {
			'::after': {
				opacity: 1,
			},
		},
		// Token fills use more :not() clauses than the forced-colors Highlight/GrayText
		// rules. StyleX emits those as separate atomic classes, so the token selectors
		// would win inside forced-colors unless the two palettes are mutually exclusive.
		'@media not (forced-colors: active)': {
			':is([data-disabled="true"] *)': {
				opacity: vars.interaction.disabledOpacity,
			},
			':is([data-hovered="true"] *):not(:is([data-pressed="true"] *)):not(:is([data-selected="true"] *, [data-indeterminate="true"] *)):not(:is([data-invalid="true"] *)):not(:is([data-disabled="true"] *, [data-readonly="true"] *))':
				{
					backgroundImage: vars.actionControlFinish.raised,
					borderColor: vars.color.border.accent,
				},
			':is([data-pressed="true"] *):not(:is([data-selected="true"] *, [data-indeterminate="true"] *)):not(:is([data-invalid="true"] *)):not(:is([data-disabled="true"] *, [data-readonly="true"] *))':
				{
					backgroundImage: vars.actionControlFinish.recessed,
					borderColor: vars.color.border.accent,
				},
			':is([data-selected="true"] *, [data-indeterminate="true"] *):not(:is([data-hovered="true"] *)):not(:is([data-pressed="true"] *)):not(:is([data-invalid="true"] *))':
				{
					backgroundColor: vars.color.background.accent.solid.rest,
					borderColor: vars.color.background.accent.solid.rest,
				},
			':is([data-selected="true"] *, [data-indeterminate="true"] *):is([data-hovered="true"] *):not(:is([data-pressed="true"] *)):not(:is([data-invalid="true"] *)):not(:is([data-disabled="true"] *, [data-readonly="true"] *))':
				{
					backgroundColor: vars.color.background.accent.solid.hover,
					backgroundImage: vars.actionControlFinish.raised,
					borderColor: vars.color.background.accent.solid.hover,
				},
			':is([data-selected="true"] *, [data-indeterminate="true"] *):is([data-pressed="true"] *):not(:is([data-invalid="true"] *)):not(:is([data-disabled="true"] *, [data-readonly="true"] *))':
				{
					backgroundColor: vars.color.background.accent.solid.pressed,
					backgroundImage: vars.actionControlFinish.recessed,
					borderColor: vars.color.background.accent.solid.pressed,
				},
			':is([data-invalid="true"] *):not(:is([data-selected="true"] *, [data-indeterminate="true"] *)):not(:is([data-hovered="true"] *)):not(:is([data-pressed="true"] *))':
				{
					borderColor: vars.color.background.danger.solid.rest,
				},
			':is([data-invalid="true"] *):is([data-hovered="true"] *):not(:is([data-pressed="true"] *)):not(:is([data-selected="true"] *, [data-indeterminate="true"] *)):not(:is([data-disabled="true"] *, [data-readonly="true"] *))':
				{
					backgroundImage: vars.actionControlFinish.raised,
					borderColor: vars.color.background.danger.solid.hover,
				},
			':is([data-invalid="true"] *):is([data-pressed="true"] *):not(:is([data-selected="true"] *, [data-indeterminate="true"] *)):not(:is([data-disabled="true"] *, [data-readonly="true"] *))':
				{
					backgroundImage: vars.actionControlFinish.recessed,
					borderColor: vars.color.background.danger.solid.pressed,
				},
			':is([data-invalid="true"] *):is([data-selected="true"] *, [data-indeterminate="true"] *):not(:is([data-hovered="true"] *)):not(:is([data-pressed="true"] *))':
				{
					backgroundColor: vars.color.background.danger.solid.rest,
					borderColor: vars.color.background.danger.solid.rest,
					color: vars.color.foreground.danger.onSolid,
				},
			':is([data-invalid="true"] *):is([data-selected="true"] *, [data-indeterminate="true"] *):is([data-hovered="true"] *):not(:is([data-pressed="true"] *)):not(:is([data-disabled="true"] *, [data-readonly="true"] *))':
				{
					backgroundColor: vars.color.background.danger.solid.hover,
					backgroundImage: vars.actionControlFinish.raised,
					borderColor: vars.color.background.danger.solid.hover,
					color: vars.color.foreground.danger.onSolid,
				},
			':is([data-invalid="true"] *):is([data-selected="true"] *, [data-indeterminate="true"] *):is([data-pressed="true"] *):not(:is([data-disabled="true"] *, [data-readonly="true"] *))':
				{
					backgroundColor: vars.color.background.danger.solid.pressed,
					backgroundImage: vars.actionControlFinish.recessed,
					borderColor: vars.color.background.danger.solid.pressed,
					color: vars.color.foreground.danger.onSolid,
				},
		},
		'@media (forced-colors: active)': {
			backgroundColor: 'Canvas',
			backgroundImage: 'none',
			borderColor: 'CanvasText',
			color: 'CanvasText',
			forcedColorAdjust: 'auto',
			':is([data-disabled="true"] *)': {
				opacity: 1,
			},
			':is([data-disabled="true"] *):not(:is([data-selected="true"] *, [data-indeterminate="true"] *))':
				{
					borderColor: 'GrayText',
					color: 'GrayText',
				},
			':is([data-focus-visible="true"] *)': {
				outlineColor: 'Highlight',
			},
			':is([data-selected="true"] *, [data-indeterminate="true"] *)': {
				backgroundColor: 'Highlight',
				borderColor: 'Highlight',
				color: 'HighlightText',
			},
		},
		'@media (prefers-reduced-motion: reduce)': {
			transition: 'none',
		},
	},
	root: {
		display: 'flex',
		flexDirection: 'column',
		gap: vars.space.sp4,
		minInlineSize: 0,
		// Checkbox's own box has no room for an in-control invalid icon without it
		// floating past the label (see `indicator` below), so its icon renders on
		// the error message instead — Field's `message` slot draws it,
		// gated behind this var, which stays off for every other consumer.
		'--luke-field-message-icon': 'inline-block',
	},
	rootSizeLarge: {
		[checkboxControlSize]: fontMetrics.step20.lineHeight,
		[checkboxGlyphSize]: 'var(--luke-icon-size-small)',
		[checkboxIndicatorSize]: 'var(--luke-icon-size-medium)',
		'--luke-field-message-indent': `calc(var(${checkboxControlSize}) + var(--luke-space-sp8))`,
	},
	rootSizeMedium: {
		[checkboxControlSize]: fontMetrics.step16.lineHeight,
		[checkboxGlyphSize]: 'var(--luke-icon-size-xsmall)',
		[checkboxIndicatorSize]: 'var(--luke-icon-size-small)',
		'--luke-field-message-indent': `calc(var(${checkboxControlSize}) + var(--luke-space-sp8))`,
	},
	rootSizeSmall: {
		[checkboxControlSize]: 'var(--luke-icon-size-small)',
		[checkboxGlyphSize]: fontMetrics.step12.fontSize,
		[checkboxIndicatorSize]: 'var(--luke-icon-size-xsmall)',
		'--luke-field-message-indent': `calc(var(${checkboxControlSize}) + var(--luke-space-sp8))`,
	},
});

const checkboxRecipeStyles = createSlottedRecipeStyles({
	defaultVariants: {
		size: 'medium',
	},
	slots: {
		content: styles.content,
		control: styles.control,
		indicator: styles.indicator,
		root: styles.root,
	},
	variants: {
		size: {
			large: { root: styles.rootSizeLarge },
			medium: { root: styles.rootSizeMedium },
			small: { root: styles.rootSizeSmall },
		},
	},
});

/** Canonical per-slot resolver for the Checkbox primitive anatomy. */
export const resolveCheckboxRecipeSlotStyles = checkboxRecipeStyles.resolveSlotStyles;

/**
 * Slotted recipe for the Checkbox primitive anatomy.
 *
 * `checkboxRecipe({ size }).root / .content / .control / .indicator`.
 */
export const checkboxRecipe = createSlottedRecipe(checkboxRecipeStyles);

/** Outer variant selection for the Checkbox recipe. */
export type CheckboxRecipeVariants = SlotRecipeSelection<typeof resolveCheckboxRecipeSlotStyles>;
