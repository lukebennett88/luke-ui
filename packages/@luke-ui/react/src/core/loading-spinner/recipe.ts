import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';
import { iconSizeStyles } from '../icon/recipe.js';
import type { RecipeSelection } from '../styles/recipe-authoring.js';
import { compiledStyle, recipe } from '../styles/recipe-authoring.js';
import { spinnerOverlayBase } from '../styles/spinner-overlay.js';

/**
 * @internal
 */
export const spinAnimationName = stylex.keyframes({
	to: { transform: 'rotate(360deg)' },
});

/**
 * @internal
 */
export const rubberBandAnimationName = stylex.keyframes({
	'0%': { strokeDasharray: '2 100' },
	'50%': { strokeDasharray: '65 100', strokeDashoffset: -20 },
	'100%': { strokeDasharray: '2 100', strokeDashoffset: -100 },
});

/**
 * Slotted recipe for the `LoadingSpinner` primitive.
 *
 * `loadingSpinnerRecipe({ color, size }).root / .svg / .indicator` for the spinner itself, and
 * `.childrenWrapper / .hiddenChildren / .spinnerOverlay` for the in-place children overlay.
 */
export const loadingSpinnerRecipe = recipe({
	defaultVariants: {
		size: 'medium',
	},
	slots: {
		childrenWrapper: {
			alignItems: 'center',
			display: 'inline-flex',
			justifyContent: 'center',
			position: 'relative',
		},
		hiddenChildren: {
			display: 'contents',
			visibility: 'hidden',
		},
		indicator: {
			animationDuration: '2s',
			animationIterationCount: 'infinite',
			animationName: rubberBandAnimationName,
			animationTimingFunction: 'cubic-bezier(0.42, 0, 0.58, 1)',
			strokeDasharray: '100 100',
			'@media (forced-colors: active)': {
				animationName: 'none',
				strokeDasharray: '25 100',
				strokeDashoffset: 0,
			},
			'@media (prefers-reduced-motion: reduce)': {
				animationName: 'none',
				strokeDasharray: '25 100',
				strokeDashoffset: 0,
			},
		},
		root: {
			animationDuration: '1.2s',
			animationIterationCount: 'infinite',
			animationName: spinAnimationName,
			animationTimingFunction: 'linear',
			color: 'currentColor',
			display: 'inline-flex',
			flexShrink: 0,
			'@media (forced-colors: active)': { animationName: 'none' },
			'@media (prefers-reduced-motion: reduce)': { animationName: 'none' },
		},
		spinnerOverlay: compiledStyle(spinnerOverlayBase),
		svg: {
			blockSize: '100%',
			display: 'block',
			inlineSize: '100%',
			transform: 'rotate(-90deg)',
		},
	},
	variants: {
		color: {
			accent: { root: { color: vars.color.foreground.accent.rest } },
			danger: { root: { color: vars.color.foreground.danger.rest } },
			info: { root: { color: vars.color.foreground.info.rest } },
			primary: { root: { color: vars.color.text.primary } },
			secondary: { root: { color: vars.color.text.secondary } },
			success: { root: { color: vars.color.foreground.success.rest } },
			warning: { root: { color: vars.color.foreground.warning.rest } },
		},
		size: {
			large: { root: compiledStyle(iconSizeStyles.large) },
			medium: { root: compiledStyle(iconSizeStyles.medium) },
			small: { root: compiledStyle(iconSizeStyles.small) },
			xsmall: { root: compiledStyle(iconSizeStyles.xsmall) },
		},
	},
});

/** Outer variant selection for the `LoadingSpinner` recipe. */
export type LoadingSpinnerRecipeVariants = RecipeSelection<typeof loadingSpinnerRecipe>;
