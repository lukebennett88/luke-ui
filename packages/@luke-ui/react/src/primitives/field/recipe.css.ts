import { createVar, fallbackVar } from '@vanilla-extract/css';
import {
	invalidIndicatorIconForcedColors,
	invalidMessageIcon,
} from '../../styles/invalid-indicator.js';
import type { RecipeSelection, SlottedConfigInput } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';
import { vars } from '../../theme/contract.css.js';

const dataDisabledSelector = '[data-disabled="true"]';
const dataRequiredSelector = '[data-required="true"]';

/** Optional indentation shared with form controls that place messages beneath their labels. */
export const fieldMessageIndent = createVar();

/**
 * `fieldMessageIndent` with its `0px` fallback pre-applied, computed once so the
 * error message's own hang-indent and the icon box it wraps around
 * (`invalidMessageIcon`) can never disagree about where the text resumes.
 */
const messageIndent = fallbackVar(fieldMessageIndent, '0px');

/**
 * Optional leading icon on the error message, off (`none`) by default. A field
 * recipe whose own control has no room for an in-control invalid icon switches this
 * to `inline-block` on its own `root` slot instead (see `primitives/checkbox/recipe.css.ts`) so its
 * `FieldError` message renders `invalidMessageIcon`. `InputGroup` (as a real `Icon`
 * element) and `Combobox` (via `invalid-indicator.ts`) draw their invalid icon inside
 * the control and never touch this var, so the icon still appears exactly once per
 * field — attached to the control where there is room, beside the message where there
 * is not.
 */
export const fieldMessageIcon = createVar();

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
			...vars.font.support,
			minInlineSize: 0,
			paddingInlineStart: messageIndent,
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
						'(forced-colors: active)': {
							selectors: {
								'&::before': invalidIndicatorIconForcedColors,
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
					// aligning its message under its label) on every line, then `textIndent`
					// pulls the FIRST line back by that same amount so the icon — the line's
					// first inline content, sized to fill exactly that reserved space by
					// `invalidMessageIcon` itself — sits in it instead of pushing the text
					// after it. Wrapped lines keep the padding, so they hang aligned with the
					// text rather than tucking under the icon.
					paddingInlineStart: messageIndent,
					textIndent: `calc(-1 * ${messageIndent})`,

					selectors: {
						'&::before': {
							...invalidMessageIcon(messageIndent),
							display: fallbackVar(fieldMessageIcon, 'none'),
						},
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
