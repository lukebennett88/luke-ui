import { keyframes } from '@vanilla-extract/css';
import { vars } from '../theme/contract.css.js';
import { iconSizeVariants } from './icon.css.js';
import type { RecipeSelection, SlottedConfigInput } from './recipe.js';
import { recipe } from './recipe.js';

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
	slots: {
		root: {
			'@media': {
				'(forced-colors: active)': { animationName: 'none' },
				'(prefers-reduced-motion: reduce)': { animationName: 'none' },
			},
			animationDuration: rotationDuration,
			animationIterationCount: 'infinite',
			animationName: spinAnimationName,
			animationTimingFunction: 'linear',
			color: 'currentColor',
			display: 'inline-flex',
			flexShrink: 0,
		},
		svg: {
			blockSize: '100%',
			display: 'block',
			inlineSize: '100%',
			transform: 'rotate(-90deg)',
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
		spinnerOverlay: {
			alignItems: 'center',
			display: 'flex',
			inset: 0,
			justifyContent: 'center',
			position: 'absolute',
		},
	},
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		color: {
			accent: { root: { color: vars.color.intent.accent.text } },
			danger: { root: { color: vars.color.intent.danger.text } },
			info: { root: { color: vars.color.intent.info.text } },
			primary: { root: { color: vars.color.text.primary } },
			secondary: { root: { color: vars.color.text.secondary } },
			success: { root: { color: vars.color.intent.success.text } },
			warning: { root: { color: vars.color.intent.warning.text } },
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
export const loadingSpinner = recipe(loadingSpinnerConfig);

/** Outer variant selection for the `LoadingSpinner` recipe. */
export type LoadingSpinnerVariants = RecipeSelection<typeof loadingSpinner>;
