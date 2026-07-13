import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer, styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';

export const iconButtonReset = styleInLayer('utilities', {
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

export const icon = recipeInLayer('recipes', {
	defaultVariants: { isPending: false },
	variants: {
		isPending: {
			false: {},
			true: { opacity: 0 },
		},
	},
});

/** Vanilla-extract recipe for the `IconButton` primitive's styles. */
export const iconButton = recipeInLayer('recipes', {
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
export type IconButtonVariants = RecipeVariants<typeof iconButton>;
