import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createRecipe, createRecipeStyles } from '../styles/stylex-recipe.js';

const styles = stylex.create({
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
	isStandaloneTrue: {
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
	toneAccent: {
		color: vars.color.foreground.accent.rest,
		'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"])': {
			color: vars.color.foreground.accent.hover,
		},
		'[data-pressed="true"]:not([data-disabled="true"])': {
			color: vars.color.foreground.accent.pressed,
		},
	},
	toneNeutral: {
		color: vars.color.foreground.neutral.rest,
		'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"])': {
			color: vars.color.foreground.neutral.hover,
		},
		'[data-pressed="true"]:not([data-disabled="true"])': {
			color: vars.color.foreground.neutral.pressed,
		},
	},
});

/** Canonical resolver for the `Link` component's styles. */
export const resolveLinkRecipeStyles = createRecipeStyles({
	base: styles.base,
	defaultVariants: {
		isStandalone: false,
		tone: 'accent',
	},
	variants: {
		isStandalone: {
			false: null,
			true: styles.isStandaloneTrue,
		},
		tone: {
			accent: styles.toneAccent,
			neutral: styles.toneNeutral,
		},
	},
});

/** Recipe for the `Link` component's styles. */
export const linkRecipe = createRecipe(resolveLinkRecipeStyles);

/** Variant type for the `Link` recipe. */
export type LinkRecipeVariants = RecipeSelection<typeof resolveLinkRecipeStyles>;
