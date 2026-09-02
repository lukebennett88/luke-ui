import * as stylex from '@stylexjs/stylex';
import { vars } from '../../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../../styles/stylex-recipe.js';
import { createSlottedRecipe } from '../../styles/stylex-recipe.js';

const styles = stylex.create({
	content: {
		alignItems: 'flex-start',
		color: 'inherit',
		cursor: 'pointer',
		display: 'inline-flex',
		font: 'inherit',
		gap: vars.spaceSp8,
		'min-inline-size': 0,
		'[data-disabled="true"]': {
			color: vars.colorTextDisabled,
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
		'block-size': 'var(--text-line-height, 1lh)',
		display: 'inline-flex',
		flexShrink: 0,
		'inline-size': 'var(--checkbox-control-size)',
		justifyContent: 'center',
	},
	indicator: {
		alignItems: 'center',
		backgroundColor: vars.colorSurfaceCanvas,
		backgroundImage: vars.actionControlFinishResting,
		'block-size': 'var(--checkbox-indicator-size)',
		borderColor: vars.colorBorderControl,
		borderRadius: vars.radiusDetail,
		borderStyle: 'solid',
		borderWidth: '1px',
		boxShadow: 'none',
		boxSizing: 'border-box',
		color: vars.colorForegroundAccentOnSolid,
		display: 'inline-flex',
		fontSize: 'var(--checkbox-glyph-size)',
		fontWeight: vars.fontWeightHeading,
		'inline-size': 'var(--checkbox-indicator-size)',
		justifyContent: 'center',
		lineHeight: 1,
		transitionDuration: vars.motionDurationFeedback,
		transitionProperty: 'background-color, background-image, border-color, color, opacity',
		transitionTimingFunction: vars.motionEasingStandard,
		'::after': {
			content: '"✓"',
			opacity: 0,
		},
		':is([data-focus-visible="true"] *)': {
			outlineColor: vars.colorBorderFocus,
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
				opacity: vars.interactionDisabledOpacity,
			},
			':is([data-hovered="true"] *):not(:is([data-pressed="true"] *)):not(:is([data-selected="true"] *, [data-indeterminate="true"] *)):not(:is([data-invalid="true"] *)):not(:is([data-disabled="true"] *, [data-readonly="true"] *))':
				{
					backgroundImage: vars.actionControlFinishRaised,
					borderColor: vars.colorBorderAccent,
				},
			':is([data-pressed="true"] *):not(:is([data-selected="true"] *, [data-indeterminate="true"] *)):not(:is([data-invalid="true"] *)):not(:is([data-disabled="true"] *, [data-readonly="true"] *))':
				{
					backgroundImage: vars.actionControlFinishRecessed,
					borderColor: vars.colorBorderAccent,
				},
			':is([data-selected="true"] *, [data-indeterminate="true"] *):not(:is([data-hovered="true"] *)):not(:is([data-pressed="true"] *)):not(:is([data-invalid="true"] *))':
				{
					backgroundColor: vars.colorBackgroundAccentSolidRest,
					borderColor: vars.colorBackgroundAccentSolidRest,
				},
			':is([data-selected="true"] *, [data-indeterminate="true"] *):is([data-hovered="true"] *):not(:is([data-pressed="true"] *)):not(:is([data-invalid="true"] *)):not(:is([data-disabled="true"] *, [data-readonly="true"] *))':
				{
					backgroundColor: vars.colorBackgroundAccentSolidHover,
					backgroundImage: vars.actionControlFinishRaised,
					borderColor: vars.colorBackgroundAccentSolidHover,
				},
			':is([data-selected="true"] *, [data-indeterminate="true"] *):is([data-pressed="true"] *):not(:is([data-invalid="true"] *)):not(:is([data-disabled="true"] *, [data-readonly="true"] *))':
				{
					backgroundColor: vars.colorBackgroundAccentSolidPressed,
					backgroundImage: vars.actionControlFinishRecessed,
					borderColor: vars.colorBackgroundAccentSolidPressed,
				},
			':is([data-invalid="true"] *):not(:is([data-selected="true"] *, [data-indeterminate="true"] *)):not(:is([data-hovered="true"] *)):not(:is([data-pressed="true"] *))':
				{
					borderColor: vars.colorBackgroundDangerSolidRest,
				},
			':is([data-invalid="true"] *):is([data-hovered="true"] *):not(:is([data-pressed="true"] *)):not(:is([data-selected="true"] *, [data-indeterminate="true"] *)):not(:is([data-disabled="true"] *, [data-readonly="true"] *))':
				{
					backgroundImage: vars.actionControlFinishRaised,
					borderColor: vars.colorBackgroundDangerSolidHover,
				},
			':is([data-invalid="true"] *):is([data-pressed="true"] *):not(:is([data-selected="true"] *, [data-indeterminate="true"] *)):not(:is([data-disabled="true"] *, [data-readonly="true"] *))':
				{
					backgroundImage: vars.actionControlFinishRecessed,
					borderColor: vars.colorBackgroundDangerSolidPressed,
				},
			':is([data-invalid="true"] *):is([data-selected="true"] *, [data-indeterminate="true"] *):not(:is([data-hovered="true"] *)):not(:is([data-pressed="true"] *))':
				{
					backgroundColor: vars.colorBackgroundDangerSolidRest,
					borderColor: vars.colorBackgroundDangerSolidRest,
					color: vars.colorForegroundDangerOnSolid,
				},
			':is([data-invalid="true"] *):is([data-selected="true"] *, [data-indeterminate="true"] *):is([data-hovered="true"] *):not(:is([data-pressed="true"] *)):not(:is([data-disabled="true"] *, [data-readonly="true"] *))':
				{
					backgroundColor: vars.colorBackgroundDangerSolidHover,
					backgroundImage: vars.actionControlFinishRaised,
					borderColor: vars.colorBackgroundDangerSolidHover,
					color: vars.colorForegroundDangerOnSolid,
				},
			':is([data-invalid="true"] *):is([data-selected="true"] *, [data-indeterminate="true"] *):is([data-pressed="true"] *):not(:is([data-disabled="true"] *, [data-readonly="true"] *))':
				{
					backgroundColor: vars.colorBackgroundDangerSolidPressed,
					backgroundImage: vars.actionControlFinishRecessed,
					borderColor: vars.colorBackgroundDangerSolidPressed,
					color: vars.colorForegroundDangerOnSolid,
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
		gap: vars.spaceSp4,
		'min-inline-size': 0,
		// Checkbox's own box has no room for an in-control invalid icon without it
		// floating past the label (see `indicator` below), so its icon renders on
		// the error message instead — Field's `message` slot draws it,
		// gated behind this var, which stays off for every other consumer.
		'--luke-field-message-icon': 'inline-block',
	},
	rootSizeLarge: {
		'--checkbox-control-size': '28px',
		'--checkbox-glyph-size': 'var(--luke-icon-size-small)',
		'--checkbox-indicator-size': 'var(--luke-icon-size-medium)',
		'--luke-field-message-indent': 'calc(var(--checkbox-control-size) + var(--luke-space-sp8))',
	},
	rootSizeMedium: {
		'--checkbox-control-size': '24px',
		'--checkbox-glyph-size': 'var(--luke-icon-size-xsmall)',
		'--checkbox-indicator-size': 'var(--luke-icon-size-small)',
		'--luke-field-message-indent': 'calc(var(--checkbox-control-size) + var(--luke-space-sp8))',
	},
	rootSizeSmall: {
		'--checkbox-control-size': 'var(--luke-icon-size-small)',
		'--checkbox-glyph-size': '12px',
		'--checkbox-indicator-size': 'var(--luke-icon-size-xsmall)',
		'--luke-field-message-indent': 'calc(var(--checkbox-control-size) + var(--luke-space-sp8))',
	},
});

/**
 * Slotted recipe for the Checkbox primitive anatomy.
 *
 * `checkboxRecipe({ size }).root() / .content() / .control() / .indicator()`.
 */
export const [checkboxRecipe, resolveCheckboxRecipeSlotStyles] = createSlottedRecipe({
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

/** Outer variant selection for the Checkbox recipe. */
export type CheckboxRecipeVariants = RecipeSelection<typeof checkboxRecipe>;
