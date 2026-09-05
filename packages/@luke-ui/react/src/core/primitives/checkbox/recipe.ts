import { fontMetrics } from '../../../theme/font-metric-scale.stylex.js';
import { vars } from '../../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../../styles/recipe-authoring.js';
import { recipe } from '../../styles/recipe-authoring.js';
import type { XStyleProp } from '../../styles/xstyle.js';

/** Module-local custom properties set by `root` size variants and read by `control`/`indicator`. */
const checkboxControlSize = '--checkbox-control-size';
const checkboxIndicatorSize = '--checkbox-indicator-size';
const checkboxGlyphSize = '--checkbox-glyph-size';

/** Stateful slotted recipe for the Checkbox primitive anatomy. */
export const checkboxStateRecipe = recipe({
	defaultVariants: {
		isDisabled: false,
		isFocusVisible: false,
		isHovered: false,
		isIndeterminate: false,
		isInvalid: false,
		isPressed: false,
		isReadOnly: false,
		isSelected: false,
		size: 'medium',
	},
	slots: {
		content: {
			alignItems: 'flex-start',
			color: 'inherit',
			cursor: 'pointer',
			display: 'inline-flex',
			font: 'inherit',
			gap: vars.space.sp8,
			minInlineSize: 0,
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
			'@media (forced-colors: active)': {
				backgroundColor: 'Canvas',
				backgroundImage: 'none',
				borderColor: 'CanvasText',
				color: 'CanvasText',
				forcedColorAdjust: 'auto',
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
			// floating past the label, so its icon renders on the error message instead.
			'--luke-field-message-icon': 'inline-block',
		},
	},
	variants: {
		isDisabled: {
			false: null,
			true: {
				content: {
					color: vars.color.text.disabled,
					cursor: 'not-allowed',
				},
				indicator: {
					'@media not (forced-colors: active)': { opacity: vars.interaction.disabledOpacity },
				},
			},
		},
		isFocusVisible: {
			false: null,
			true: {
				content: { outline: 'none' },
				indicator: {
					outlineColor: vars.color.border.focus,
					outlineOffset: '2px',
					outlineStyle: 'solid',
					outlineWidth: '2px',
				},
			},
		},
		isHovered: { false: null, true: null },
		isIndeterminate: {
			false: null,
			true: { indicator: { '::after': { content: '"−"', opacity: 1 } } },
		},
		isInvalid: { false: null, true: null },
		isPressed: { false: null, true: null },
		isReadOnly: { false: null, true: null },
		isSelected: { false: null, true: null },
		size: {
			large: {
				root: {
					[checkboxControlSize]: fontMetrics.step20.lineHeight,
					[checkboxGlyphSize]: 'var(--luke-icon-size-small)',
					[checkboxIndicatorSize]: 'var(--luke-icon-size-medium)',
					'--luke-field-message-indent': `calc(var(${checkboxControlSize}) + var(--luke-space-sp8))`,
				},
			},
			medium: {
				root: {
					[checkboxControlSize]: fontMetrics.step16.lineHeight,
					[checkboxGlyphSize]: 'var(--luke-icon-size-xsmall)',
					[checkboxIndicatorSize]: 'var(--luke-icon-size-small)',
					'--luke-field-message-indent': `calc(var(${checkboxControlSize}) + var(--luke-space-sp8))`,
				},
			},
			small: {
				root: {
					[checkboxControlSize]: 'var(--luke-icon-size-small)',
					[checkboxGlyphSize]: fontMetrics.step12.fontSize,
					[checkboxIndicatorSize]: 'var(--luke-icon-size-xsmall)',
					'--luke-field-message-indent': `calc(var(${checkboxControlSize}) + var(--luke-space-sp8))`,
				},
			},
		},
	},
	compoundVariants: [
		{
			isSelected: true,
			isIndeterminate: false,
			style: { indicator: { '::after': { opacity: 1 } } },
		},
		{
			isSelected: true,
			isIndeterminate: false,
			isHovered: false,
			isPressed: false,
			isInvalid: false,
			style: {
				indicator: {
					'@media not (forced-colors: active)': {
						backgroundColor: vars.color.background.accent.solid.rest,
						borderColor: vars.color.background.accent.solid.rest,
					},
				},
			},
		},
		{
			isSelected: false,
			isIndeterminate: true,
			isHovered: false,
			isPressed: false,
			isInvalid: false,
			style: {
				indicator: {
					'@media not (forced-colors: active)': {
						backgroundColor: vars.color.background.accent.solid.rest,
						borderColor: vars.color.background.accent.solid.rest,
					},
				},
			},
		},
		{
			isHovered: true,
			isPressed: false,
			isSelected: false,
			isIndeterminate: false,
			isInvalid: false,
			isDisabled: false,
			isReadOnly: false,
			style: {
				indicator: {
					'@media not (forced-colors: active)': {
						backgroundImage: vars.actionControlFinish.raised,
						borderColor: vars.color.border.accent,
					},
				},
			},
		},
		{
			isPressed: true,
			isSelected: false,
			isIndeterminate: false,
			isInvalid: false,
			isDisabled: false,
			isReadOnly: false,
			style: {
				indicator: {
					'@media not (forced-colors: active)': {
						backgroundImage: vars.actionControlFinish.recessed,
						borderColor: vars.color.border.accent,
					},
				},
			},
		},
		{
			isSelected: true,
			isIndeterminate: false,
			isHovered: true,
			isPressed: false,
			isInvalid: false,
			isDisabled: false,
			isReadOnly: false,
			style: {
				indicator: {
					'@media not (forced-colors: active)': {
						backgroundColor: vars.color.background.accent.solid.hover,
						backgroundImage: vars.actionControlFinish.raised,
						borderColor: vars.color.background.accent.solid.hover,
					},
				},
			},
		},
		{
			isSelected: false,
			isIndeterminate: true,
			isHovered: true,
			isPressed: false,
			isInvalid: false,
			isDisabled: false,
			isReadOnly: false,
			style: {
				indicator: {
					'@media not (forced-colors: active)': {
						backgroundColor: vars.color.background.accent.solid.hover,
						backgroundImage: vars.actionControlFinish.raised,
						borderColor: vars.color.background.accent.solid.hover,
					},
				},
			},
		},
		{
			isSelected: true,
			isIndeterminate: false,
			isPressed: true,
			isInvalid: false,
			isDisabled: false,
			isReadOnly: false,
			style: {
				indicator: {
					'@media not (forced-colors: active)': {
						backgroundColor: vars.color.background.accent.solid.pressed,
						backgroundImage: vars.actionControlFinish.recessed,
						borderColor: vars.color.background.accent.solid.pressed,
					},
				},
			},
		},
		{
			isSelected: false,
			isIndeterminate: true,
			isPressed: true,
			isInvalid: false,
			isDisabled: false,
			isReadOnly: false,
			style: {
				indicator: {
					'@media not (forced-colors: active)': {
						backgroundColor: vars.color.background.accent.solid.pressed,
						backgroundImage: vars.actionControlFinish.recessed,
						borderColor: vars.color.background.accent.solid.pressed,
					},
				},
			},
		},
		{
			isInvalid: true,
			isSelected: false,
			isIndeterminate: false,
			isHovered: false,
			isPressed: false,
			style: {
				indicator: {
					'@media not (forced-colors: active)': {
						borderColor: vars.color.background.danger.solid.rest,
					},
				},
			},
		},
		{
			isInvalid: true,
			isSelected: false,
			isIndeterminate: false,
			isHovered: true,
			isPressed: false,
			isDisabled: false,
			isReadOnly: false,
			style: {
				indicator: {
					'@media not (forced-colors: active)': {
						backgroundImage: vars.actionControlFinish.raised,
						borderColor: vars.color.background.danger.solid.hover,
					},
				},
			},
		},
		{
			isInvalid: true,
			isSelected: false,
			isIndeterminate: false,
			isPressed: true,
			isDisabled: false,
			isReadOnly: false,
			style: {
				indicator: {
					'@media not (forced-colors: active)': {
						backgroundImage: vars.actionControlFinish.recessed,
						borderColor: vars.color.background.danger.solid.pressed,
					},
				},
			},
		},
		{
			isInvalid: true,
			isSelected: true,
			isIndeterminate: false,
			isHovered: false,
			isPressed: false,
			style: {
				indicator: {
					'@media not (forced-colors: active)': {
						backgroundColor: vars.color.background.danger.solid.rest,
						borderColor: vars.color.background.danger.solid.rest,
						color: vars.color.foreground.danger.onSolid,
					},
				},
			},
		},
		{
			isInvalid: true,
			isSelected: false,
			isIndeterminate: true,
			isHovered: false,
			isPressed: false,
			style: {
				indicator: {
					'@media not (forced-colors: active)': {
						backgroundColor: vars.color.background.danger.solid.rest,
						borderColor: vars.color.background.danger.solid.rest,
						color: vars.color.foreground.danger.onSolid,
					},
				},
			},
		},
		{
			isInvalid: true,
			isSelected: true,
			isIndeterminate: false,
			isHovered: true,
			isPressed: false,
			isDisabled: false,
			isReadOnly: false,
			style: {
				indicator: {
					'@media not (forced-colors: active)': {
						backgroundColor: vars.color.background.danger.solid.hover,
						backgroundImage: vars.actionControlFinish.raised,
						borderColor: vars.color.background.danger.solid.hover,
						color: vars.color.foreground.danger.onSolid,
					},
				},
			},
		},
		{
			isInvalid: true,
			isSelected: false,
			isIndeterminate: true,
			isHovered: true,
			isPressed: false,
			isDisabled: false,
			isReadOnly: false,
			style: {
				indicator: {
					'@media not (forced-colors: active)': {
						backgroundColor: vars.color.background.danger.solid.hover,
						backgroundImage: vars.actionControlFinish.raised,
						borderColor: vars.color.background.danger.solid.hover,
						color: vars.color.foreground.danger.onSolid,
					},
				},
			},
		},
		{
			isInvalid: true,
			isSelected: true,
			isIndeterminate: false,
			isPressed: true,
			isDisabled: false,
			isReadOnly: false,
			style: {
				indicator: {
					'@media not (forced-colors: active)': {
						backgroundColor: vars.color.background.danger.solid.pressed,
						backgroundImage: vars.actionControlFinish.recessed,
						borderColor: vars.color.background.danger.solid.pressed,
						color: vars.color.foreground.danger.onSolid,
					},
				},
			},
		},
		{
			isInvalid: true,
			isSelected: false,
			isIndeterminate: true,
			isPressed: true,
			isDisabled: false,
			isReadOnly: false,
			style: {
				indicator: {
					'@media not (forced-colors: active)': {
						backgroundColor: vars.color.background.danger.solid.pressed,
						backgroundImage: vars.actionControlFinish.recessed,
						borderColor: vars.color.background.danger.solid.pressed,
						color: vars.color.foreground.danger.onSolid,
					},
				},
			},
		},
		{
			isDisabled: true,
			isSelected: false,
			isIndeterminate: false,
			style: {
				indicator: {
					'@media (forced-colors: active)': {
						borderColor: 'GrayText',
						color: 'GrayText',
					},
				},
			},
		},
		{
			isFocusVisible: true,
			style: { indicator: { '@media (forced-colors: active)': { outlineColor: 'Highlight' } } },
		},
		{
			isDisabled: false,
			isReadOnly: true,
			style: { content: { cursor: 'default' } },
		},
		{
			isDisabled: true,
			isReadOnly: true,
			style: { content: { cursor: 'not-allowed' } },
		},
		{
			isSelected: true,
			isIndeterminate: false,
			style: {
				indicator: {
					'@media (forced-colors: active)': {
						backgroundColor: 'Highlight',
						borderColor: 'Highlight',
						color: 'HighlightText',
					},
				},
			},
		},
		{
			isSelected: false,
			isIndeterminate: true,
			style: {
				indicator: {
					'@media (forced-colors: active)': {
						backgroundColor: 'Highlight',
						borderColor: 'Highlight',
						color: 'HighlightText',
					},
				},
			},
		},
	],
});

type CheckboxStateRecipeVariants = RecipeSelection<typeof checkboxStateRecipe>;

export type CheckboxRecipeVariants = Pick<CheckboxStateRecipeVariants, 'size'>;

type CheckboxRecipeSlots = keyof ReturnType<typeof checkboxStateRecipe>;
type CheckboxRecipeSelection = CheckboxRecipeVariants & {
	xstyle?: Partial<Record<CheckboxRecipeSlots, XStyleProp>>;
};

/** Public Checkbox recipe with neutral interaction state. */
export function checkboxRecipe(
	selection?: CheckboxRecipeSelection,
): ReturnType<typeof checkboxStateRecipe> {
	const { size, xstyle } = selection ?? {};
	return checkboxStateRecipe({ size, xstyle });
}
