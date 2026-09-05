import type { StyleRule } from '@vanilla-extract/css';
import { globalKeyframes } from '@vanilla-extract/css';
import { vars } from '../../theme/tokens.stylex.js';
import { globalStyleInLayer } from '../styles/layered-style.css.js';
import { attributeSelector } from '../styles/selectors.js';
import {
	loadingSkeletonScopeAttribute,
	skeletonPulseAnimationName,
	skeletonRadiusVar,
} from './scope.js';

globalKeyframes(skeletonPulseAnimationName, {
	'0%': { filter: 'brightness(1)' },
	'10%': { filter: 'brightness(1)' },
	'50%': { filter: 'brightness(0.88)' },
	'60%': { filter: 'brightness(0.88)' },
	'100%': { filter: 'brightness(1)' },
});

// Force a flat placeholder surface on the root and all block descendants. Keep these rules in the
// direct `recipes` layer: a nested StyleX sublayer would outrank it for `!important` declarations,
// while the direct layer must outrank consumer `overrides` and `utilities` declarations. The
// stylesheet contract test rejects `!important` in `recipes.priorityN`.
//
// The casts silence csstype on keyword-only properties, which don't admit the `!important` suffix
// in their type.
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
	animationName: skeletonPulseAnimationName,
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

const scopeSelector = attributeSelector(loadingSkeletonScopeAttribute);
const inlineRoot = `${scopeSelector}[data-skeleton-inline]`;
const blockChild = `${scopeSelector}:not([data-skeleton-inline]) > *`;

// Inline mode (wrapping text or other non-element children): the scope attribute's own element is
// the surface. `borderRadius` and `display` stay in StyleX (`loading-skeleton.tsx`) — ordinary,
// non-`!important` styling with no need to out-rank consumer or descendant CSS.
globalStyleInLayer('recipes', inlineRoot, { ...surface, ...pulse });

// The child's own background is forced flat and pulses in sync with the `::after` overlay below,
// so at a rounded corner its square edge would otherwise show through the overlay's rounded
// recess. Give it the same radius so both surfaces agree on the visible shape.
globalStyleInLayer('recipes', blockChild, {
	...surface,
	...pulse,
	borderRadius: `var(${skeletonRadiusVar}, 0px)`,
	overflow: 'hidden !important',
	position: 'relative !important' as 'relative',
});

globalStyleInLayer('recipes', `${blockChild} *`, {
	'@media': {
		'(forced-colors: active)': forcedColorsSurface,
	},
	...surface,
});

// A pseudo-element painted over the child covers visuals the forced styles can't reach (nested backgrounds,
// rounded corners); `inset: -1px` also covers the child's border box edges.
globalStyleInLayer('recipes', `${blockChild}::after`, {
	...surface,
	...pulse,
	borderRadius: `var(${skeletonRadiusVar}, 0px)`,
	content: '""',
	inset: '-1px',
	position: 'absolute',
});
