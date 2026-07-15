import { keyframes } from '@vanilla-extract/css';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer, styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';
import { iconSizeVariants } from './icon.css.js';

const colorVariants = {
	accent: { color: vars.color.intent.accent.text },
	danger: { color: vars.color.intent.danger.text },
	info: { color: vars.color.intent.info.text },
	primary: { color: vars.color.text.primary },
	secondary: { color: vars.color.text.secondary },
	success: { color: vars.color.intent.success.text },
	warning: { color: vars.color.intent.warning.text },
} as const;

const base = styleInLayer('recipes', {
	color: 'currentColor',
	display: 'inline-flex',
	flexShrink: 0,
});

/** Vanilla-extract recipe for the `LoadingSpinner` primitive's styles. */
export const spinner = recipeInLayer('recipes', {
	base,
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		color: colorVariants,
		size: iconSizeVariants,
	},
});

/** Variant type for the `LoadingSpinner` recipe. */
export type LoadingSpinnerVariants = RecipeVariants<typeof spinner>;

/** @internal */
export const spinAnimationName = keyframes({
	to: { transform: 'rotate(360deg)' },
});

export const spinnerState = recipeInLayer('recipes', {
	defaultVariants: {
		mode: 'determinate',
	},
	variants: {
		mode: {
			determinate: {},
			indeterminate: {
				'@media': {
					'(forced-colors: active)': { animationName: 'none' },
					'(prefers-reduced-motion: reduce)': { animationName: 'none' },
				},
				animationDuration: vars.motion.duration.ambient,
				animationIterationCount: 'infinite',
				animationName: spinAnimationName,
				animationTimingFunction: vars.motion.easing.standard,
			},
		},
	},
});

export const svg = recipeInLayer('recipes', {
	base: {
		blockSize: '100%',
		display: 'block',
		inlineSize: '100%',
		transform: 'rotate(-90deg)',
	},
});

/** @internal */
export const rubberBandAnimationName = keyframes({
	'0%': { strokeDasharray: '2 100' },
	'50%': { strokeDasharray: '65 100', strokeDashoffset: -20 },
	'100%': { strokeDasharray: '2 100', strokeDashoffset: -100 },
});

export const indicator = recipeInLayer('recipes', {
	base: {
		strokeDasharray: '100 100',
	},
	defaultVariants: {
		mode: 'determinate',
	},
	variants: {
		mode: {
			determinate: {
				transitionDuration: vars.motion.duration.fast,
				transitionProperty: 'stroke-dashoffset',
				transitionTimingFunction: vars.motion.easing.exit,
			},
			indeterminate: {
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
				animationDuration: vars.motion.duration.ambient,
				animationIterationCount: 'infinite',
				animationName: rubberBandAnimationName,
				animationTimingFunction: vars.motion.easing.standard,
			},
		},
	},
});
