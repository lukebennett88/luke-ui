import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';

const dataDisabledSelector = '[data-disabled="true"]';
const dataRequiredSelector = '[data-required="true"]';

/** Vanilla-extract recipe for the `Field` primitive's layout styles. */
export const field = recipeInLayer('recipes', {
	base: {
		display: 'flex',
		flexDirection: 'column',
		gap: vars.space[100],
		minInlineSize: 0,
	},
});

/** Vanilla-extract recipe for the `Field` primitive's label styles. */
export const fieldLabel = recipeInLayer('recipes', {
	base: {
		color: vars.color.text.primary,
		fontSize: vars.font[200].fontSize,
		fontWeight: vars.font.weight.label,
		letterSpacing: vars.font[200].letterSpacing,
		lineHeight: vars.font[200].lineHeight,
		minInlineSize: 0,

		selectors: {
			[`${dataDisabledSelector} &`]: {
				color: vars.color.textDisabled,
			},
		},
	},
	defaultVariants: {
		necessityIndicator: 'icon',
	},
	variants: {
		necessityIndicator: {
			icon: {
				selectors: {
					[`${dataRequiredSelector} &::after`]: {
						color: vars.color.intent.danger.text,
						content: '"*"',
						marginInlineStart: vars.space[100],
					},
				},
			},
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
});

export type FieldLabelVariants = RecipeVariants<typeof fieldLabel>;

/** Vanilla-extract recipe for the `Field` primitive's message styles. */
export const fieldMessage = recipeInLayer('recipes', {
	base: {
		fontSize: vars.font[200].fontSize,
		letterSpacing: vars.font[200].letterSpacing,
		lineHeight: vars.font[200].lineHeight,
		minInlineSize: 0,

		selectors: {
			[`${dataDisabledSelector} &`]: {
				color: vars.color.textDisabled,
			},
		},
	},
	defaultVariants: {
		tone: 'description',
	},
	variants: {
		tone: {
			description: {
				color: vars.color.text.secondary,
			},
			error: {
				color: vars.color.intent.danger.text,
			},
		},
	},
});

export type FieldMessageVariants = RecipeVariants<typeof fieldMessage>;
