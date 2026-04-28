import { keyframes } from '@vanilla-extract/css';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer, styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../styles/vars.css.js';
import { tokenKeys, tokens } from '../tokens/index.js';
import { iconSizeVariants } from './icon.css.js';

const colorKeys = tokenKeys(tokens.foregroundColor);

const colorVariants = Object.fromEntries(colorKeys.map((key) => [key, { color: vars.color[key] }]));

const base = styleInLayer('recipes', {
	color: 'currentColor',
	display: 'inline-flex',
	flexShrink: 0,
});

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

export type LoadingSpinnerVariants = RecipeVariants<typeof spinner>;

const spin = keyframes({
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
				animationDuration: vars.motion.duration.slow,
				animationIterationCount: 'infinite',
				animationName: spin,
				animationTimingFunction: vars.motion.easing.linear,
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

const rubberBand = keyframes({
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
				transitionDuration: vars.motion.duration.quick,
				transitionProperty: 'stroke-dashoffset',
				transitionTimingFunction: vars.motion.easing.exit,
			},
			indeterminate: {
				animationDuration: vars.motion.duration.slower,
				animationIterationCount: 'infinite',
				animationName: rubberBand,
				animationTimingFunction: vars.motion.easing.emphasized,
			},
		},
	},
});
