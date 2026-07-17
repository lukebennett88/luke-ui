import { keyframes } from '@vanilla-extract/css';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer, styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';
import { iconSizeVariants } from './icon.css.js';

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

/**
 * @internal
 */
export const spinAnimationName = keyframes({
	to: { transform: 'rotate(360deg)' },
});

const base = styleInLayer('recipes', {
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

export const svg = recipeInLayer('recipes', {
	base: {
		blockSize: '100%',
		display: 'block',
		inlineSize: '100%',
		transform: 'rotate(-90deg)',
	},
});

/**
 * @internal
 */
export const rubberBandAnimationName = keyframes({
	'0%': { strokeDasharray: '2 100' },
	'50%': { strokeDasharray: '65 100', strokeDashoffset: -20 },
	'100%': { strokeDasharray: '2 100', strokeDashoffset: -100 },
});

export const indicator = recipeInLayer('recipes', {
	base: {
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
});

export const childrenWrapper = styleInLayer('recipes', {
	alignItems: 'center',
	display: 'inline-flex',
	justifyContent: 'center',
	position: 'relative',
});

export const hiddenChildren = styleInLayer('recipes', {
	display: 'contents',
	visibility: 'hidden',
});

export const spinnerOverlay = styleInLayer('recipes', {
	alignItems: 'center',
	display: 'flex',
	inset: 0,
	justifyContent: 'center',
	position: 'absolute',
});
