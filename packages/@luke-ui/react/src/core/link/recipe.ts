import * as stylex from '@stylexjs/stylex';
import { tokens } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createSingleRecipe } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	base: {
		color: tokens.colorForegroundAccentRest,
		cursor: 'pointer',
		font: 'inherit',
		textDecoration: 'underline',
		textDecorationColor: 'currentColor',
		transitionDuration: tokens.motionDurationFeedback,
		transitionProperty: 'color, text-decoration-color',
		transitionTimingFunction: tokens.motionEasingStandard,
		'[data-disabled="true"]': {
			cursor: 'not-allowed',
			opacity: tokens.interactionDisabledOpacity,
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
		'min-block-size': tokens.controlSizeMinTarget,
		'min-inline-size': tokens.controlSizeMinTarget,
		textDecoration: 'none',
		'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"])': {
			textDecoration: 'underline',
		},
		'[data-pressed="true"]:not([data-disabled="true"])': {
			textDecoration: 'underline',
		},
	},
	toneAccent: {
		color: tokens.colorForegroundAccentRest,
		'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"])': {
			color: tokens.colorForegroundAccentHover,
		},
		'[data-pressed="true"]:not([data-disabled="true"])': {
			color: tokens.colorForegroundAccentPressed,
		},
	},
	toneNeutral: {
		color: tokens.colorForegroundNeutralRest,
		'[data-hovered="true"]:not([data-pressed="true"]):not([data-disabled="true"])': {
			color: tokens.colorForegroundNeutralHover,
		},
		'[data-pressed="true"]:not([data-disabled="true"])': {
			color: tokens.colorForegroundNeutralPressed,
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
