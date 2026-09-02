import * as stylex from '@stylexjs/stylex';
import { vars } from '../../../theme/tokens.stylex.js';
import { invalidIndicator } from '../../styles/invalid-indicator.stylex.js';
import type { RecipeSelection } from '../../styles/stylex-recipe.js';
import { createSlottedRecipe } from '../../styles/stylex-recipe.js';

/** Custom-property names shared by Field's message slot and Checkbox's root styles. */
export const fieldMessageIndent = '--luke-field-message-indent' as const;

export const fieldMessageIcon = '--luke-field-message-icon' as const;

const styles = stylex.create({
	label: {
		color: vars.colorTextPrimary,
		fontFamily: vars.fontLabelFontFamily,
		fontSize: vars.fontLabelFontSize,
		fontWeight: vars.fontLabelFontWeight,
		letterSpacing: vars.fontLabelLetterSpacing,
		lineHeight: vars.fontLabelLineHeight,
		minInlineSize: 0,
		// Marker for a disabled RAC field ancestor (`[data-disabled]` lives on the field, not the
		// label). `:is([data-disabled="true"] *)` keeps this competing with the resting colour at
		// equal specificity rather than raising it.
		':is([data-disabled="true"] *)': {
			color: vars.colorTextDisabled,
		},
	},
	labelNecessityIcon: {
		':is([data-required="true"] *)': {
			'::after': {
				color: vars.colorForegroundDangerRest,
				content: '"*"',
				marginInlineStart: vars.spaceSp4,
			},
		},
	},
	labelNecessityLabel: {
		':is([data-required="true"] *)': {
			'::after': {
				color: vars.colorTextSecondary,
				content: '"(required)"',
				fontWeight: vars.fontWeightBody,
				marginInlineStart: vars.spaceSp4,
			},
		},
	},
	message: {
		fontFamily: vars.fontLabelFontFamily,
		fontSize: vars.fontLabelFontSize,
		fontWeight: vars.fontWeightBody,
		letterSpacing: vars.fontLabelLetterSpacing,
		lineHeight: vars.fontLabelLineHeight,
		minInlineSize: 0,
		paddingInlineStart: 'var(--luke-field-message-indent, 0px)',
	},
	messageDescription: {
		color: vars.colorTextSecondary,
	},
	messageError: {
		color: vars.colorForegroundDangerRest,
		// Hanging indent, not `flex`: `errorMessage` is typed `ReactNode` (rich content) and RAC's
		// `FieldError` also accepts a render-prop child, so this recipe cannot wrap the message in a
		// span of its own. `padding-inline-start` reserves `--luke-field-message-indent` (`0px`
		// unless a consumer sets it, e.g. `Checkbox` aligning its message under its label) on every
		// line, then `textIndent` pulls the first line back by that same amount so the icon sits in
		// it. Wrapped lines keep the padding, so they hang aligned with the text rather than tucking
		// under the icon.
		paddingInlineStart: 'var(--luke-field-message-indent, 0px)',
		textIndent: 'calc(-1 * var(--luke-field-message-indent, 0px))',
		'::before': {
			backgroundColor: vars.colorForegroundDangerRest,
			blockSize: vars.iconSizeXsmall,
			content: "''",
			display: 'var(--luke-field-message-icon, none)',
			flexShrink: 0,
			inlineSize:
				'max(calc(var(--luke-field-message-indent, 0px) - var(--luke-space-sp8)), var(--luke-icon-size-xsmall))',
			marginInlineEnd: vars.spaceSp8,
			maskImage: invalidIndicator.maskImage,
			maskPosition: 'center',
			maskRepeat: 'no-repeat',
			maskSize: vars.iconSizeXsmall,
			textIndent: 0,
			verticalAlign: 'middle',
		},
		'@media (forced-colors: active)': {
			'::before': {
				backgroundColor: invalidIndicator.forcedColorsBackgroundColor,
			},
		},
	},
	root: {
		display: 'flex',
		flexDirection: 'column',
		gap: vars.spaceSp4,
		minInlineSize: 0,
	},
});

/**
 * Slotted recipe for the `Field` primitive.
 *
 * `fieldRecipe({ necessityIndicator, tone }).root() / .label() / .message()`.
 */
export const [fieldRecipe, resolveFieldRecipeSlotStyles] = createSlottedRecipe({
	defaultVariants: {
		necessityIndicator: 'icon',
		tone: 'description',
	},
	slots: {
		label: styles.label,
		message: styles.message,
		root: styles.root,
	},
	variants: {
		necessityIndicator: {
			icon: { label: styles.labelNecessityIcon },
			label: { label: styles.labelNecessityLabel },
		},
		tone: {
			description: { message: styles.messageDescription },
			error: { message: styles.messageError },
		},
	},
});

/** Outer variant selection for the `Field` recipe. */
export type FieldRecipeVariants = RecipeSelection<typeof fieldRecipe>;

/** Allowed `necessityIndicator` values for the field label. */
export type FieldNecessityIndicator = NonNullable<FieldRecipeVariants['necessityIndicator']>;
