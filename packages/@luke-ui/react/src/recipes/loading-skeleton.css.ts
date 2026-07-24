import type { StyleRule } from '@vanilla-extract/css';
import { fallbackVar, keyframes } from '@vanilla-extract/css';
import { globalStyleInLayer, styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';

/**
 * @internal
 */
export const skeletonAnimationName = keyframes({
	'0%': { filter: 'brightness(1)' },
	'10%': { filter: 'brightness(1)' },
	'50%': { filter: 'brightness(0.88)' },
	'60%': { filter: 'brightness(0.88)' },
	'100%': { filter: 'brightness(1)' },
});

/** @internal */
export const skeletonRadiusVar = '--luke-loading-skeleton-radius';

// Forced onto every skeleton surface so an arbitrary wrapped component reads as a flat placeholder shape.
// `!important` is deliberate: cascade layers alone can't beat consumers' un-layered or inline styles, and the
// skeleton must always win over its children. The casts silence csstype on keyword-only properties, which don't
// admit the `!important` suffix in their type.
const surface = {
	backgroundClip: 'border-box !important',
	backgroundColor: `${vars.color.loadingSkeleton} !important`,
	backgroundImage: 'none !important',
	border: 'none !important',
	// Text spanning multiple lines keeps its radius on every line fragment.
	boxDecorationBreak: 'clone !important' as 'clone',
	boxShadow: 'none !important',
	color: 'transparent !important',
	cursor: 'default !important',
	outline: 'none !important',
	pointerEvents: 'none !important' as 'none',
	userSelect: 'none !important' as 'none',
} as const satisfies StyleRule;

const forcedColorsSurface = {
	backgroundColor: 'CanvasText !important',
	forcedColorAdjust: 'none !important' as 'none',
} as const satisfies StyleRule;

// Not `!important`: reduced-motion overrides (below) and animation syncing must stay able to adjust it.
const pulse = {
	animationDelay: '0.5s',
	animationDuration: '2s',
	animationIterationCount: 'infinite',
	animationName: skeletonAnimationName,
	animationTimingFunction: vars.motion.easing.standard,
	'@media': {
		'(forced-colors: active)': {
			...forcedColorsSurface,
			animationName: 'none',
		},
		// The global reduced-motion reset lives in the lowest layer, so it can't win against this rule.
		'(prefers-reduced-motion: reduce)': {
			animationName: 'none',
		},
	},
} as const satisfies StyleRule;

/** Vanilla-extract class for the `LoadingSkeleton` component's styles. */
export const loadingSkeleton = styleInLayer('recipes', {
	selectors: {
		// Inline mode: the element itself is the skeleton (used when wrapping text).
		'&[data-skeleton-inline]': {
			...surface,
			...pulse,
			borderRadius: fallbackVar(`var(${skeletonRadiusVar})`, vars.radius.detail),
		},
		// Block mode: the wrapper is invisible; skeleton styles apply to its direct children.
		'&:not([data-skeleton-inline])': {
			display: 'contents',
		},
	},
});

// The child's own background is forced flat and pulses in sync with the `::after` overlay below,
// so at a rounded corner its square edge would otherwise show through the overlay's rounded
// recess. Give it the same radius so both surfaces agree on the visible shape.
globalStyleInLayer('recipes', `${loadingSkeleton}:not([data-skeleton-inline]) > *`, {
	...surface,
	...pulse,
	borderRadius: `var(${skeletonRadiusVar}, 0px)`,
	overflow: 'hidden !important',
	position: 'relative !important' as 'relative',
});

globalStyleInLayer('recipes', `${loadingSkeleton}:not([data-skeleton-inline]) > * *`, {
	'@media': {
		'(forced-colors: active)': forcedColorsSurface,
	},
	...surface,
});

// A pseudo-element painted over the child covers visuals the forced styles can't reach (nested backgrounds,
// rounded corners); `inset: -1px` also covers the child's border box edges.
globalStyleInLayer('recipes', `${loadingSkeleton}:not([data-skeleton-inline]) > *::after`, {
	...surface,
	...pulse,
	borderRadius: `var(${skeletonRadiusVar}, 0px)`,
	content: '""',
	inset: '-1px',
	position: 'absolute',
});
