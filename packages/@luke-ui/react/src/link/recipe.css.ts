import { styleInLayer } from '../styles/layered-style.css.js';
import type { RecipeSelection } from '../styles/recipe.js';
import { recipe } from '../styles/recipe.js';
import { vars } from '../theme/contract.css.js';

const base = styleInLayer('recipes', {
	'@media': {
		'(forced-colors: active)': {
			color: 'LinkText',
			forcedColorAdjust: 'auto',
			selectors: {
				'&[data-disabled="true"]': {
					color: 'GrayText',
					opacity: 1,
				},
			},
		},
		'(prefers-reduced-motion: reduce)': {
			transition: 'none',
		},
	},
	color: vars.color.foreground.accent.rest,
	cursor: 'pointer',
	font: 'inherit',
	textDecoration: 'underline',
	textDecorationColor: 'currentColor',
	transitionDuration: vars.motion.duration.feedback,
	transitionProperty: 'color, text-decoration-color',
	transitionTimingFunction: vars.motion.easing.standard,
	selectors: {
		'&[data-disabled="true"]': {
			cursor: 'not-allowed',
			opacity: vars.interaction.disabledOpacity,
		},
	},
});

/** Vanilla-extract recipe for the `Link` component's styles. */
export const linkRecipe = recipe({
	base,
	defaultVariants: {
		isStandalone: false,
		tone: 'accent',
	},
	variants: {
		isStandalone: {
			false: {},
			true: {
				alignItems: 'center',
				display: 'inline-flex',
				minBlockSize: vars.controlSize.minTarget,
				minInlineSize: vars.controlSize.minTarget,
				selectors: {
					'&[data-hovered="true"]:not([data-disabled="true"])': {
						textDecoration: 'underline',
					},
					'&[data-pressed="true"]:not([data-disabled="true"])': {
						textDecoration: 'underline',
					},
				},
				textDecoration: 'none',
			},
		},
		tone: {
			accent: {
				color: vars.color.foreground.accent.rest,
				selectors: {
					'&[data-hovered="true"]:not([data-disabled="true"])': {
						color: vars.color.foreground.accent.hover,
					},
					'&[data-pressed="true"]:not([data-disabled="true"])': {
						color: vars.color.foreground.accent.pressed,
					},
				},
			},
			neutral: {
				color: vars.color.foreground.neutral.rest,
				selectors: {
					'&[data-hovered="true"]:not([data-disabled="true"])': {
						color: vars.color.foreground.neutral.hover,
					},
					'&[data-pressed="true"]:not([data-disabled="true"])': {
						color: vars.color.foreground.neutral.pressed,
					},
				},
			},
		},
	},
});

/** Variant type for the `Link` recipe. */
export type LinkRecipeVariants = RecipeSelection<typeof linkRecipe>;
