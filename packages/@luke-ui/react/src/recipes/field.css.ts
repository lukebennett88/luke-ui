import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer } from '../styles/layered-style.css.js';
import { vars } from '../styles/vars.css.js';

const dataDisabledSelector = '[data-disabled="true"]';
const dataRequiredSelector = '[data-required="true"]';

export const field = recipeInLayer('recipes', {
	base: {
		display: 'flex',
		flexDirection: 'column',
		gap: vars.space.xxsmall,
		minInlineSize: 0,
	},
});

export const fieldLabel = recipeInLayer('recipes', {
	base: {
		color: vars.foregroundColor.primary,
		fontSize: vars.font.size.small,
		fontWeight: vars.font.weight.medium,
		lineHeight: vars.font.lineHeight.tight,
		minInlineSize: 0,

		selectors: {
			[`${dataDisabledSelector} &`]: {
				color: vars.foregroundColor.disabled,
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
						color: vars.foregroundColor.critical,
						content: '"*"',
						marginInlineStart: vars.space.xxsmall,
					},
				},
			},
			label: {
				selectors: {
					[`${dataRequiredSelector} &::after`]: {
						color: vars.foregroundColor.secondary,
						content: '"(required)"',
						fontWeight: vars.font.weight.regular,
						marginInlineStart: vars.space.xxsmall,
					},
				},
			},
		},
	},
});

export type FieldLabelVariants = RecipeVariants<typeof fieldLabel>;

export const fieldMessage = recipeInLayer('recipes', {
	base: {
		fontSize: vars.font.size.small,
		lineHeight: vars.font.lineHeight.tight,
		minInlineSize: 0,

		selectors: {
			[`${dataDisabledSelector} &`]: {
				color: vars.foregroundColor.disabled,
			},
		},
	},
	defaultVariants: {
		tone: 'description',
	},
	variants: {
		tone: {
			description: {
				color: vars.foregroundColor.secondary,
			},
			error: {
				color: vars.foregroundColor.critical,
			},
		},
	},
});

export type FieldMessageVariants = RecipeVariants<typeof fieldMessage>;
