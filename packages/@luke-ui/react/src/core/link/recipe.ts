import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createSingleRecipe } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	base: {
		color: vars.colorForegroundAccentRest,
		cursor: 'pointer',
		font: 'inherit',
		textDecoration: 'underline',
		textDecorationColor: 'currentColor',
		transitionDuration: vars.motionDurationFeedback,
		transitionProperty: 'color, text-decoration-color',
		transitionTimingFunction: vars.motionEasingStandard,
		'[data-disabled="true"]': {
			cursor: 'not-allowed',
			opacity: vars.interactionDisabledOpacity,
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
	isStandaloneFalse: {},
	isStandaloneTrue: {
		alignItems: 'center',
		display: 'inline-flex',
		'min-block-size': vars.controlSizeMinTarget,
		'min-inline-size': vars.controlSizeMinTarget,
		textDecoration: 'none',
		'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"])': {
			textDecoration: 'underline',
		},
		'[data-pressed="true"]:not([data-disabled="true"])': {
			textDecoration: 'underline',
		},
	},
	toneAccent: {
		color: vars.colorForegroundAccentRest,
		'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"])': {
			color: vars.colorForegroundAccentHover,
		},
		'[data-pressed="true"]:not([data-disabled="true"])': {
			color: vars.colorForegroundAccentPressed,
		},
	},
	toneNeutral: {
		color: vars.colorForegroundNeutralRest,
		'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"])': {
			color: vars.colorForegroundNeutralHover,
		},
		'[data-pressed="true"]:not([data-disabled="true"])': {
			color: vars.colorForegroundNeutralPressed,
		},
	},
});

/** Recipe for the `Link` component's styles. */
export const { recipe: linkRecipe, resolveStyles: resolveLinkRecipeStyles } = createSingleRecipe({
	base: styles.base,
	defaultVariants: {
		isStandalone: false,
		tone: 'accent',
	},
	variants: {
		isStandalone: {
			false: styles.isStandaloneFalse,
			true: styles.isStandaloneTrue,
		},
		tone: {
			accent: styles.toneAccent,
			neutral: styles.toneNeutral,
		},
	},
});

/** Variant type for the `Link` recipe. */
export type LinkRecipeVariants = RecipeSelection<typeof linkRecipe>;
