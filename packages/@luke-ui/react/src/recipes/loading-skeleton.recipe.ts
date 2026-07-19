import { defineGlobalStyles, defineKeyframes, defineRecipe } from '@pandacss/dev';
import type { ColorToken } from '../../styled-system/tokens/index.mjs';
import type { SystemStyleObject } from '../../styled-system/types/system-types.d.mts';

const skeletonAnimationName = 'loadingSkeletonPulse';
const skeletonRadiusVar = '--luke-loading-skeleton-radius';
const loadingSkeletonColor = 'loadingSkeleton' satisfies ColorToken;

const forcedColorsSurface = {
	backgroundColor: 'CanvasText !important',
	forcedColorAdjust: 'none !important',
} as const satisfies SystemStyleObject;

const surface = {
	backgroundClip: 'border-box !important',
	backgroundColor: `${loadingSkeletonColor} !important`,
	backgroundImage: 'none !important',
	border: 'none !important',
	boxDecorationBreak: 'clone !important',
	boxShadow: 'none !important',
	color: 'transparent !important',
	cursor: 'default !important',
	outlineColor: 'transparent !important',
	outlineStyle: 'none !important',
	outlineWidth: '0 !important',
	pointerEvents: 'none !important',
	userSelect: 'none !important',
} as const satisfies SystemStyleObject;

const pulse = {
	'@media (forced-colors: active)': {
		...forcedColorsSurface,
		animationName: 'none',
	},
	'@media (prefers-reduced-motion: reduce)': {
		animationName: 'none',
	},
	animationDelay: '0.5s',
	animationDuration: '2s',
	animationIterationCount: 'infinite',
	animationName: skeletonAnimationName,
	animationTimingFunction: 'standard',
} as const satisfies SystemStyleObject;

export const loadingSkeletonRecipe = defineRecipe({
	className: 'loading-skeleton',
	description: 'Placeholder surface that mirrors the layout of loading content.',
	base: {
		'&[data-skeleton-inline]': {
			...surface,
			...pulse,
			borderRadius: `var(${skeletonRadiusVar}, var(--radii-detail))`,
		},
		'&:not([data-skeleton-inline])': { display: 'contents' },
	},
});

export const loadingSkeletonGlobalCss = defineGlobalStyles({
	'@layer recipes': {
		'.loading-skeleton:not([data-skeleton-inline]) > *': {
			...surface,
			...pulse,
			overflow: 'hidden !important',
			position: 'relative !important',
		},
		'.loading-skeleton:not([data-skeleton-inline]) > * *': {
			'@media (forced-colors: active)': forcedColorsSurface,
			...surface,
		},
		'.loading-skeleton:not([data-skeleton-inline]) > *::after': {
			...surface,
			...pulse,
			borderRadius: `var(${skeletonRadiusVar}, 0px)`,
			content: '""',
			inset: '-1px',
			position: 'absolute',
		},
	},
});

export const loadingSkeletonKeyframes = defineKeyframes({
	[skeletonAnimationName]: {
		'0%': { filter: 'brightness(1)' },
		'10%': { filter: 'brightness(1)' },
		'50%': { filter: 'brightness(0.88)' },
		'60%': { filter: 'brightness(0.88)' },
		'100%': { filter: 'brightness(1)' },
	},
});
