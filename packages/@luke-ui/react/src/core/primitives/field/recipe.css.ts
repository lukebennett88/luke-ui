import type { StyleRule } from '@vanilla-extract/css';
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
 * var (see `Checkbox`, which aligns its error under the label text).
 */
export const fieldMessageIndent = createVar();

/**
 * `fieldMessageIndent` with its `0px` fallback pre-applied, computed once so the
 * error message's own hang-indent and the icon box it wraps around
 * (`errorIcon`) can never disagree about where the text resumes.
 */
const messageIndent = fallbackVar(fieldMessageIndent, '0px');

/** Gap between the error icon and the message text that follows it. */
const errorIconGap = vars.space.sp8;

/**
 * Leading `exclamationTriangle` icon on every error message. It is the field's non-colour invalid
 * cue, so controls draw none of their own. The icon's `inlineSize` plus `marginInlineEnd` equals
 * `messageIndent` exactly, so the text resumes at the label's inline edge. `max()` floors the
 * `inlineSize` at the icon's own size when no indent is set. `textIndent: 0` cancels the message's
 * negative indent so it does not also shift the icon.
 */
const errorIcon = {
	backgroundColor: vars.color.foreground.danger.rest,
	blockSize: vars.iconSize.xsmall,
	content: '""',
	display: 'inline-block',
	inlineSize: `max(calc(${messageIndent} - ${errorIconGap}), ${vars.iconSize.xsmall})`,
	marginInlineEnd: errorIconGap,
	maskImage: iconMaskUrls.exclamationTriangle,
	maskPosition: 'center',
	maskRepeat: 'no-repeat',
	maskSize: vars.iconSize.xsmall,
	textIndent: 0,
	verticalAlign: 'middle',
} satisfies StyleRule;

/**
 * Raw slotted config for the `Field` primitive.
 *
 * Slots: `root` (layout), `label`, and `message` (description/error text).
 */
const fieldConfig = {
	slots: {
		root: {
			display: 'flex',
			flexDirection: 'column',
			gap: vars.space.sp4,
			minInlineSize: 0,
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
				message: {
					'@media': {
						// `CanvasText` keeps the icon solid when author colours are ignored.
						'(forced-colors: active)': {
							selectors: {
								'&::before': { backgroundColor: 'CanvasText' },
							},
						},
					},
					color: vars.color.foreground.danger.rest,
					// Hanging indent, not `flex`: `errorMessage` is typed `ReactNode` (rich
					// content, e.g. `<>text <strong>emphasis</strong> text</>`) and RAC's
					// `FieldError` also accepts a render-prop child, so this recipe cannot
					// safely wrap the message in a span of its own to make it a single flex
					// item — a `flex` container instead turns every top-level child into its
					// own item, each wrapping independently. `paddingInlineStart` reserves
					// `fieldMessageIndent` (`0px` unless a consumer sets it, e.g. `Checkbox`
					// aligning its error under its label) on every line, then `textIndent`
					// pulls the FIRST line back by that same amount so the icon — the line's
					// first inline content, sized to fill exactly that reserved space by
					// `errorIcon` itself — sits in it instead of pushing the text
					// after it. Wrapped lines keep the padding, so they hang aligned with the
					// text rather than tucking under the icon. Descriptions omit this indent
					// so supporting copy starts at the field's inline edge.
					paddingInlineStart: messageIndent,
					textIndent: `calc(-1 * ${messageIndent})`,

					selectors: {
						'&::before': errorIcon,
					},
				},
			},
		},
	},
} as const satisfies SlottedConfigInput;

/**
 * Slotted recipe for the `Field` primitive.
 *
 * `fieldRecipe({ necessityIndicator, tone }).root() / .label() / .message()`.
 */
export const fieldRecipe = recipe(fieldConfig);

/** Outer variant selection for the `Field` recipe. */
export type FieldRecipeVariants = RecipeSelection<typeof fieldRecipe>;

/** Allowed `necessityIndicator` values for the field label. */
export type FieldNecessityIndicator = keyof typeof fieldConfig.variants.necessityIndicator;
