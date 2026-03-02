import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer, styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../styles/vars.css.js';

const base = styleInLayer('recipes', {
	color: vars.themeColor.linkColor,
	font: 'inherit',
	textDecoration: 'underline',
	textDecorationColor: 'currentColor',
	transitionDuration: vars.motion.duration.fast,
	transitionProperty: 'color, text-decoration-color',
	transitionTimingFunction: vars.motion.easing.standard,
});

export const link = recipeInLayer('recipes', {
	base,
	defaultVariants: {
		isStandalone: false,
		tone: 'brand',
	},
	variants: {
		isStandalone: {
			false: {},
			true: {
				textDecoration: 'none',
				selectors: {
					'&:enabled:hover': {
						textDecoration: 'underline',
					},
				},
			},
		},
		tone: {
			brand: {
				color: vars.themeColor.linkColor,
				selectors: {
					'&:enabled:hover': {
						color: vars.themeColor.linkColorHover,
					},
				},
			},
			neutral: {
				color: vars.foregroundColor.secondary,
				selectors: {
					'&:enabled:hover': {
						color: vars.foregroundColor.primary,
					},
				},
			},
			inverted: {
				color: vars.foregroundColor.inverse,
			},
		},
	},
});

export type LinkVariants = RecipeVariants<typeof link>;
