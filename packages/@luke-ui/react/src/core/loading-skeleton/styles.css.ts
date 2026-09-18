import type { StyleRule } from '@vanilla-extract/css';
import { createVar, fallbackVar, keyframes } from '@vanilla-extract/css';
import { vars } from '../../theme/contract.css.js';
import { globalStyleInLayer, style } from '../styles/layered-style.css.js';

// Registered so the browser interpolates it smoothly (unregistered custom properties only snap at
// keyframe boundaries). Inherited so every descendant reads the one value the root animates.
// Travel range matches `sheenBackgroundSize`: at 200% width, -200% parks the highlight just off
// inline-start and 100% parks it just past inline-end.
const sheenPositionVar = createVar({
	inherits: true,
	initialValue: '-200%',
	syntax: '<percentage>',
});

/**
 * @internal
 */
export const skeletonAnimationName = keyframes({
	'0%': { vars: { [sheenPositionVar]: '-200%' } },
	'100%': { vars: { [sheenPositionVar]: '100%' } },
});

/** @internal */
export const skeletonRadiusVar = createVar();

const skeletonBase = vars.color.loadingSkeleton;
const skeletonHighlight = `color-mix(in oklab, ${skeletonBase}, white 35%)`;

const sheenBackgroundSize = '200% 100%';
const sheenGradient = `linear-gradient(to right, ${skeletonBase}, ${skeletonHighlight}, ${skeletonBase})`;

// `background-position` has no logical form. The animated var stays direction-agnostic; only the
// physical x that consumes it flips. Increasing `background-position-x` moves the highlight left, so
// LTR (start→end = left→right) needs a decreasing position — the negation. RTL uses the raw value.
const sheenPositionX = `calc(-1 * ${sheenPositionVar})`;
const sheenPositionXRtl = `calc(${sheenPositionVar})`;

// Clears the gradient so the surface falls back to its flat `backgroundColor`. Nested inside
// `surface`'s `@supports` because vanilla-extract does not preserve source order between different
// at-rule types — a sibling `@media` can compile before the `@supports` it should override.
const flatSurface = {
	backgroundImage: 'none !important',
	backgroundPositionX: '0px !important',
	backgroundPositionY: '0px !important',
	backgroundRepeat: 'repeat !important',
	backgroundSize: 'auto !important',
} as const satisfies StyleRule;

const forcedColorsSurface = {
	backgroundColor: 'CanvasText !important',
	forcedColorAdjust: 'none !important' as 'none',
} as const satisfies StyleRule;

// `!important` so the skeleton always wins over wrapped children — cascade layers alone cannot beat
// un-layered or inline styles. Casts silence csstype on keyword-only properties that reject the
// `!important` suffix in their type.
const surface = {
	backgroundClip: 'border-box !important',
	backgroundColor: `${skeletonBase} !important`,
	backgroundImage: 'none !important',
	border: 'none !important',
	boxDecorationBreak: 'clone !important' as 'clone',
	boxShadow: 'none !important',
	color: 'transparent !important',
	cursor: 'default !important',
	outline: 'none !important',
	pointerEvents: 'none !important' as 'none',
	// Wrapped interactives declare `transition-property: background-color` for hover/press. Left in
	// place, that transition fights every sheen frame as if it were a one-off style change.
	transitionProperty: 'none !important',
	userSelect: 'none !important' as 'none',

	'@media': {
		'(forced-colors: active)': forcedColorsSurface,
	},

	'@supports': {
		'(background-color: color-mix(in oklab, red, blue))': {
			backgroundImage: `${sheenGradient} !important`,
			backgroundPositionX: `${sheenPositionX} !important`,
			backgroundPositionY: '0px !important',
			// No tiling: otherwise a second highlight copy sits on the surface and the loop seam swaps
			// one for the other in a single frame.
			backgroundRepeat: 'no-repeat !important',
			backgroundSize: `${sheenBackgroundSize} !important`,
			'@media': {
				'(forced-colors: active)': { ...forcedColorsSurface, ...flatSurface },
				'(prefers-reduced-motion: reduce)': flatSurface,
			},
		},
	},
} as const satisfies StyleRule;

// Effective writing direction via `:dir()`, so a nearer `dir="ltr"` inside an RTL ancestor wins.
const surfaceRtl = {
	'@supports': {
		'(background-color: color-mix(in oklab, red, blue))': {
			backgroundPositionX: `${sheenPositionXRtl} !important`,
		},
	},
} as const satisfies StyleRule;

// Only the root runs the animation; descendants inherit `sheenPositionVar`. Not `!important` so the
// reduced-motion override below can turn it off.
const sheen = {
	animationDelay: '0.5s',
	animationDuration: '3s',
	animationIterationCount: 'infinite',
	animationName: skeletonAnimationName,
	animationTimingFunction: 'linear',
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
export const loadingSkeletonClassName = style({
	selectors: {
		// Inline mode: the element itself is the skeleton and the animation root.
		'&[data-skeleton-inline]': {
			...surface,
			...sheen,
			borderRadius: fallbackVar(skeletonRadiusVar, vars.radius.detail),
		},
		'&[data-skeleton-inline]:dir(rtl)': surfaceRtl,
		// Block mode: wrapper paints nothing but stays the sole animation root. `display: contents`
		// still inherits computed style, so `sheenPositionVar` flows to the children below.
		'&:not([data-skeleton-inline])': {
			...sheen,
			display: 'contents',
		},
	},
});

globalStyleInLayer('structural', `${loadingSkeletonClassName}:not([data-skeleton-inline]) > *`, {
	...surface,
	borderRadius: fallbackVar(skeletonRadiusVar, '0px'),
	overflow: 'hidden !important',
	position: 'relative !important' as 'relative',
});

globalStyleInLayer(
	'structural',
	`${loadingSkeletonClassName}:not([data-skeleton-inline]) > *:dir(rtl)`,
	surfaceRtl,
);

globalStyleInLayer('structural', `${loadingSkeletonClassName}:not([data-skeleton-inline]) > * *`, {
	...surface,
});

globalStyleInLayer(
	'structural',
	`${loadingSkeletonClassName}:not([data-skeleton-inline]) > * *:dir(rtl)`,
	surfaceRtl,
);

// Overlay covers visuals forced styles can't reach (nested backgrounds, rounded corners).
globalStyleInLayer(
	'structural',
	`${loadingSkeletonClassName}:not([data-skeleton-inline]) > *::after`,
	{
		...surface,
		borderRadius: fallbackVar(skeletonRadiusVar, '0px'),
		content: '""',
		inset: '-1px',
		position: 'absolute',
	},
);

globalStyleInLayer(
	'structural',
	`${loadingSkeletonClassName}:not([data-skeleton-inline]) > *:dir(rtl)::after`,
	surfaceRtl,
);
