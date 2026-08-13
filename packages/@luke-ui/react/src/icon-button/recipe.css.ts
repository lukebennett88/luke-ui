import { styleInLayer } from '../styles/layered-style.css.js';
import type { RecipeSelection } from '../styles/recipe.js';
import { recipe } from '../styles/recipe.js';
import { vars } from '../theme/contract.css.js';

export const iconButtonReset = styleInLayer('recipes', {
	'@media': {
		'(forced-colors: active)': {
			selectors: {
				'&[data-pending="true"]::after': {
					borderColor: 'ButtonText',
					borderInlineEndColor: 'transparent',
				},
			},
		},
	},
	paddingInline: 0,
	selectors: {
		'&[data-pending="true"]::after': {
			borderColor: 'currentColor',
			borderInlineEndColor: 'transparent',
			borderRadius: vars.radius.full,
			borderStyle: 'solid',
			borderWidth: '2px',
			blockSize: vars.iconSize.xsmall,
			content: '',
			inlineSize: vars.iconSize.xsmall,
			position: 'absolute',
		},
	},
});

export const iconButtonIcon = recipe({
	defaultVariants: { isPending: false },
	variants: {
		isPending: {
			false: {},
			true: { opacity: 0 },
		},
	},
});

/** Vanilla-extract recipe for the `IconButton` primitive's styles. */
export const iconButtonRecipe = recipe({
	variants: {
		size: {
			medium: {
				inlineSize: vars.controlSize.medium,
			},
			small: {
				inlineSize: vars.controlSize.small,
			},
		},
	},
});

/** Variant type for the `IconButton` recipe. */
export type IconButtonRecipeVariants = RecipeSelection<typeof iconButtonRecipe>;
