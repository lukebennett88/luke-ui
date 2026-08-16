import { keyframes } from '@vanilla-extract/css';
import { iconSizeVariants } from '../icon/recipe.css.js';
import type { RecipeSelection, SlottedConfigInput } from '../styles/recipe.js';
import { recipe } from '../styles/recipe.js';
import { spinnerOverlayBase } from '../styles/spinner-overlay.js';
import { vars } from '../theme/contract.css.js';

const rotationDuration = '1.2s';
const rubberBandDuration = '2s';
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
		color: {
			accent: { root: { color: vars.color.foreground.accent.default } },
			danger: { root: { color: vars.color.foreground.danger.default } },
			info: { root: { color: vars.color.foreground.info.default } },
			primary: { root: { color: vars.color.text.primary } },
			secondary: { root: { color: vars.color.text.secondary } },
			success: { root: { color: vars.color.foreground.success.default } },
			warning: { root: { color: vars.color.foreground.warning.default } },
		},
		size: {
			large: { root: iconSizeVariants.large },
			medium: { root: iconSizeVariants.medium },
			small: { root: iconSizeVariants.small },
			xsmall: { root: iconSizeVariants.xsmall },
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
