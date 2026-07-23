import { vars } from '../theme/contract.css.js';
import type { RecipeSelection, SlottedConfigInput } from './recipe.js';
import { recipe } from './recipe.js';

const dataDisabledSelector = '[data-disabled="true"]';
const dataRequiredSelector = '[data-required="true"]';

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
			gap: vars.space[100],
			minInlineSize: 0,
		},
		label: {
			color: vars.color.text.primary,
			...vars.font[200],
			fontWeight: vars.font.weight.label,
			minInlineSize: 0,

			selectors: {
				[`${dataDisabledSelector} &`]: {
					color: vars.color.textDisabled,
				},
			},
		},
		message: {
			...vars.font[200],
			minInlineSize: 0,

			selectors: {
				[`${dataDisabledSelector} &`]: {
					color: vars.color.textDisabled,
				},
			},
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
							color: vars.color.intent.danger.text,
							content: '"*"',
							marginInlineStart: vars.space[100],
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
							marginInlineStart: vars.space[100],
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
					color: vars.color.intent.danger.text,
				},
			},
		},
	},
} as const satisfies SlottedConfigInput;

/**
 * Slotted recipe for the `Field` primitive.
 *
 * `field({ necessityIndicator, tone }).root() / .label() / .message()`.
 */
export const field = recipe(fieldConfig);

/** Outer variant selection for the `Field` recipe. */
export type FieldVariants = RecipeSelection<typeof field>;

/** Allowed `necessityIndicator` values for the field label. */
export type FieldNecessityIndicator = keyof typeof fieldConfig.variants.necessityIndicator;
