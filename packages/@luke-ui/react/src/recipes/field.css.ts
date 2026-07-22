import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';

const dataDisabledSelector = '[data-disabled="true"]';
const dataRequiredSelector = '[data-required="true"]';

const fieldRecipe = recipeInLayer('recipes', {
	base: {
		display: 'flex',
		flexDirection: 'column',
		gap: vars.space[100],
		minInlineSize: 0,
	},
});

const fieldLabelRecipe = recipeInLayer('recipes', {
	base: {
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

export type FieldLabelVariants = RecipeVariants<typeof fieldLabelRecipe>;

const fieldMessageRecipe = recipeInLayer('recipes', {
	base: {
		...vars.font[200],
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

export type FieldMessageVariants = RecipeVariants<typeof fieldMessageRecipe>;

export function field(): {
	root: () => string;
	label: (variants?: Parameters<typeof fieldLabelRecipe>[0]) => string;
	message: (variants?: Parameters<typeof fieldMessageRecipe>[0]) => string;
} {
	return {
		root: () => fieldRecipe(),
		label: (variants) => fieldLabelRecipe(variants),
		message: (variants) => fieldMessageRecipe(variants),
	};
}
