import { styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';
import type { RecipeSelection } from './recipe.js';
import { recipe } from './recipe.js';

export const iconButtonReset = styleInLayer('utilities', {
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
			borderColor: vars.color.border.focus,
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

export const icon = recipe({
	defaultVariants: { isPending: false },
	variants: {
		isPending: {
			false: {},
			true: { opacity: 0 },
		},
	},
});

/** Vanilla-extract recipe for the `IconButton` primitive's styles. */
export const iconButton = recipe({
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
export type IconButtonVariants = RecipeSelection<typeof iconButton>;
