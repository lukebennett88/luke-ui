import { keyframes } from '@vanilla-extract/css';
import { iconSizeVariants } from '../icon/recipe.css.js';
import type { RecipeSelection } from '../styles/recipe-types.js';
import type { SlottedConfigInput } from '../styles/recipe.js';
import { recipe } from '../styles/recipe.js';
import { spinnerOverlayBase } from '../styles/spinner-overlay.js';
import { contextualForeground } from '../styles/surface.js';

const rotationDuration = '1.2s';
// 2× spin so the dash cycle and rotation stay phase-locked.
const rubberBandDuration = '2.4s';
// A stronger curve parks the arc at its shortest length for about a third of every loop, so the
// spinner reads as stalled.
const rubberBandEasing = 'cubic-bezier(0.42, 0, 0.58, 1)';

/**
 * @internal
 */
export const spinAnimationName = keyframes({
	to: { transform: 'rotate(360deg)' },
});

/**
 * @internal
 */
export const rubberBandAnimationName = keyframes({
	'0%': { strokeDasharray: '2 100' },
	'50%': { strokeDasharray: '65 100', strokeDashoffset: -20 },
	'100%': { strokeDasharray: '2 100', strokeDashoffset: -100 },
});

/**
 * Raw slotted config for the `LoadingSpinner` primitive.
 *
 * Slots: `root` (the animated spinner span), `svg`, `indicator` (the rubber-band
 * ring), and the in-place children overlay slots `childrenWrapper`,
 * `hiddenChildren`, and `spinnerOverlay`.
 */
const loadingSpinnerConfig = {
	defaultVariants: {
		size: 'px24',
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
			'@media': {
				'(forced-colors: active)': {
					animationName: 'none',
					strokeDasharray: '25 100',
					strokeDashoffset: 0,
				},
				'(prefers-reduced-motion: reduce)': {
					animationName: 'none',
					strokeDasharray: '25 100',
					strokeDashoffset: 0,
				},
			},
			animationDuration: rubberBandDuration,
			animationIterationCount: 'infinite',
			animationName: rubberBandAnimationName,
			animationTimingFunction: rubberBandEasing,
			strokeDasharray: '100 100',
		},
		root: {
			animationDuration: rotationDuration,
			animationIterationCount: 'infinite',
			animationName: spinAnimationName,
			animationTimingFunction: 'linear',
			color: 'currentColor',
			display: 'inline-flex',
			flexShrink: 0,
			'@media': {
				'(forced-colors: active)': { animationName: 'none' },
				'(prefers-reduced-motion: reduce)': { animationName: 'none' },
			},
		},
		spinnerOverlay: spinnerOverlayBase,
		svg: {
			blockSize: '100%',
			display: 'block',
			inlineSize: '100%',
			transform: 'rotate(-90deg)',
		},
	},
	variants: {
		// Each colour reads the nearest recognised surface, like `Text`'s colours.
		color: {
			accent: { root: { color: contextualForeground('accent') } },
			danger: { root: { color: contextualForeground('danger') } },
			info: { root: { color: contextualForeground('info') } },
			primary: { root: { color: contextualForeground('primary') } },
			secondary: { root: { color: contextualForeground('secondary') } },
			success: { root: { color: contextualForeground('success') } },
			warning: { root: { color: contextualForeground('warning') } },
		},
		size: {
			px32: { root: iconSizeVariants.px32 },
			px24: { root: iconSizeVariants.px24 },
			px20: { root: iconSizeVariants.px20 },
			px16: { root: iconSizeVariants.px16 },
		},
	},
} as const satisfies SlottedConfigInput;

/**
 * Slotted recipe for the `LoadingSpinner` primitive.
 *
 * `loadingSpinner({ color, size }).root() / .svg() / .indicator()` for the spinner
 * itself, and `.childrenWrapper() / .hiddenChildren() / .spinnerOverlay()` for the
 * in-place children overlay.
 */
export const loadingSpinnerRecipe = recipe(loadingSpinnerConfig);

/** Outer variant selection for the `LoadingSpinner` recipe. */
export type LoadingSpinnerRecipeVariants = RecipeSelection<typeof loadingSpinnerRecipe>;
