import { keyframes } from '@vanilla-extract/css';
import { styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';
import { iconSizeVariants } from './icon.css.js';
import type { RecipeSelection } from './recipe.js';
import { recipe } from './recipe.js';

const rotationDuration = '1.2s';
const rubberBandDuration = '2s';
const rubberBandEasing = 'cubic-bezier(0.42, 0, 0.58, 1)';

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
export const spinner = recipe({
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
export type LoadingSpinnerVariants = RecipeSelection<typeof spinner>;

/** @internal */
export const spinAnimationName = keyframes({
	to: { transform: 'rotate(360deg)' },
});

export const spinnerState = recipe({
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
				animationDuration: rotationDuration,
				animationIterationCount: 'infinite',
				animationName: spinAnimationName,
				animationTimingFunction: 'linear',
			},
		},
	},
});

export const svg = recipe({
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

export const indicator = recipe({
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
				animationDuration: rubberBandDuration,
				animationIterationCount: 'infinite',
				animationName: rubberBandAnimationName,
				animationTimingFunction: rubberBandEasing,
			},
		},
	},
});
