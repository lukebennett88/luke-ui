// This module is fully-inline authoring: it never writes `stylex` itself. The authoring transform
// expands `recipe()` into a `stylex.create(...)` call and inserts the namespace import that call
// needs, so no import or lint suppression has to be kept here for the compiled output's sake.
import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/recipe-authoring.js';
import { recipe } from '../styles/recipe-authoring.js';

/** Recipe for the `Link` component's styles. */
export const linkRecipe = recipe({
	base: {
		color: vars.color.foreground.accent.rest,
		cursor: 'pointer',
		font: 'inherit',
		textDecoration: 'underline',
		textDecorationColor: 'currentColor',
		transitionDuration: vars.motion.duration.feedback,
		transitionProperty: 'color, text-decoration-color',
		transitionTimingFunction: vars.motion.easing.standard,
		'[data-disabled="true"]': {
			cursor: 'not-allowed',
			opacity: vars.interaction.disabledOpacity,
		},
		'@media (forced-colors: active)': {
			color: 'LinkText',
			forcedColorAdjust: 'auto',
			'[data-disabled="true"]': {
				color: 'GrayText',
				opacity: 1,
			},
		},
		'@media (prefers-reduced-motion: reduce)': {
			transition: 'none',
		},
	},
	defaultVariants: {
		isStandalone: false,
		tone: 'accent',
	},
	variants: {
		isStandalone: {
			false: null,
			true: {
				alignItems: 'center',
				display: 'inline-flex',
				minBlockSize: vars.controlSize.minTarget,
				minInlineSize: vars.controlSize.minTarget,
				textDecoration: 'none',
				'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"])': {
					textDecoration: 'underline',
				},
				'[data-pressed="true"]:not([data-disabled="true"])': {
					textDecoration: 'underline',
				},
			},
		},
		tone: {
			accent: {
				color: vars.color.foreground.accent.rest,
				'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"])': {
					color: vars.color.foreground.accent.hover,
				},
				'[data-pressed="true"]:not([data-disabled="true"])': {
					color: vars.color.foreground.accent.pressed,
				},
			},
			neutral: {
				color: vars.color.foreground.neutral.rest,
				'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"])': {
					color: vars.color.foreground.neutral.hover,
				},
				'[data-pressed="true"]:not([data-disabled="true"])': {
					color: vars.color.foreground.neutral.pressed,
				},
			},
		},
	},
});

/** Variant type for the `Link` recipe. */
export type LinkRecipeVariants = RecipeSelection<typeof linkRecipe>;
