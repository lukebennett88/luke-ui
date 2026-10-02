import { createVar, fallbackVar } from '@vanilla-extract/css';
import { iconMaskUrls } from '../../../../.generated/icon-mask-data.js';
import { vars } from '../../../theme/contract.css.js';
import type { RecipeSelection } from '../../styles/recipe-types.js';
import type { SlottedConfigInput } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';

const dataDisabledSelector = '[data-disabled="true"]';
const dataRequiredSelector = '[data-required="true"]';

/**
 * Optional indentation for error messages that sit beneath a control+label row.
 * Descriptions stay at the field's inline start; only the error tone reads this
 * var. The `inline` slot sets it from `inlineFieldIndent` so an `InlineField` hangs
 * its error under the label text.
 */
const fieldMessageIndent = createVar();

/**
 * Inline distance from the start edge of an inline control to its label text: the control's
 * width plus the gap before the label. An inline control root (`CheckboxRoot`) sets it per size,
 * and the `inline` slot reads it, so any inline control indents its error the same way.
 */
export const inlineFieldIndent = createVar();

/** Gap between the error icon and the message text that follows it. */
const errorIconGap = vars.space.sp8;

/**
 * Inline size of the error icon's rail. It is `fieldMessageIndent` less the gap, so the rail plus
 * the gap spans the indent exactly and the message text starts at the label's inline edge. `max()`
 * floors the rail at the icon's own size when no indent is set.
 */
const errorIconRailInlineSize = `max(calc(${fallbackVar(fieldMessageIndent, '0px')} - ${errorIconGap}), ${vars.iconSize.xsmall})`;

/**
 * Raw slotted config for the `Field` primitive.
 *
 * Slots: `root` (stacked layout), `inline` (inline-control layout), `label`, `message`
 * (description/error text), and `icon` (the error message's leading icon).
 *
 * `FieldError` lays the error `message` out with `trackRecipe`'s `firstLine` rail alignment, which
 * centres the `icon` rail on the message's first line and keeps wrapped lines aligned with the
 * text. This recipe supplies the rail's size and glyph.
 */
const fieldConfig = {
	slots: {
		root: {
			display: 'flex',
			flexDirection: 'column',
			gap: vars.space.sp4,
			minInlineSize: 0,
		},
		inline: {
			display: 'flex',
			flexDirection: 'column',
			gap: vars.space.sp4,
			minInlineSize: 0,
			// The error hangs under the label text by the control root's `inlineFieldIndent`;
			// descriptions stay at the field's inline edge.
			vars: {
				[fieldMessageIndent]: fallbackVar(inlineFieldIndent, '0px'),
			},
		},
		label: {
			color: vars.color.text.primary,
			...vars.font.label,
			minInlineSize: 0,

			selectors: {
				[`${dataDisabledSelector} &`]: {
					color: vars.color.text.disabled,
				},
			},
		},
		message: {
			...vars.font.label,
			fontWeight: vars.font.weight.body,
			minInlineSize: 0,
		},
		icon: {},
	},
	defaultVariants: {
		necessityIndicator: 'icon',
		tone: 'description',
	},
	variants: {
		necessityIndicator: {
			icon: {
				label: {
					selectors: {
						[`${dataRequiredSelector} &::after`]: {
							color: vars.color.foreground.danger.rest,
							content: '"*"',
							marginInlineStart: vars.space.sp4,
						},
					},
				},
			},
			label: {
				label: {
					selectors: {
						[`${dataRequiredSelector} &::after`]: {
							color: vars.color.text.secondary,
							content: '"(required)"',
							fontWeight: vars.font.weight.body,
							marginInlineStart: vars.space.sp4,
						},
					},
				},
			},
		},
		tone: {
			description: {
				message: {
					color: vars.color.text.secondary,
				},
			},
			error: {
				icon: {
					'@media': {
						// `CanvasText` keeps the icon solid when author colours are ignored.
						'(forced-colors: active)': { backgroundColor: 'CanvasText' },
					},
					backgroundColor: vars.color.foreground.danger.rest,
					inlineSize: errorIconRailInlineSize,
					maskImage: iconMaskUrls.exclamationTriangle,
					maskPosition: 'center',
					maskRepeat: 'no-repeat',
					maskSize: vars.iconSize.xsmall,
				},
				message: {
					color: vars.color.foreground.danger.rest,
					gap: errorIconGap,
				},
			},
		},
	},
} as const satisfies SlottedConfigInput;

/**
 * Slotted recipe for the `Field` primitive.
 *
 * `fieldRecipe({ necessityIndicator, tone }).root() / .inline() / .label() / .message() / .icon()`.
 */
export const fieldRecipe = recipe(fieldConfig);

/** Outer variant selection for the `Field` recipe. */
export type FieldRecipeVariants = RecipeSelection<typeof fieldRecipe>;

/** Allowed `necessityIndicator` values for the field label. */
export type FieldNecessityIndicator = keyof typeof fieldConfig.variants.necessityIndicator;
