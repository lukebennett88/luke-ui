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

// Forced onto every skeleton surface — the inline root and every block descendant — so an
// arbitrary wrapped component reads as a flat placeholder shape. `!important` is deliberate:
// cascade layers alone can't beat consumers' un-layered or inline styles, and the skeleton must
// always win over its children.
//
// This lives here, in retained CSS written DIRECTLY into the `recipes` layer, and not in
// `stylex.create` (see `loading-skeleton.tsx`), because a direct parent-layer rule beats a nested
// sublayer for normal declarations, but that relationship REVERSES for `!important`: a StyleX
// `recipes.priorityN` sublayer rule with `!important` beats a direct `@layer recipes` rule with
// `!important`. StyleX's own recipe/override sublayers sit inside `recipes`, so a `!important`
// forced surface authored there would rank ABOVE this layer's retained CSS, inverting the
// contract. Direct `@layer recipes` is also what lets this forced surface outrank a consumer's
// `overrides`/`utilities`-layer `!important`: top-level cascade-layer order reverses for
// `!important` too, so an earlier layer (`recipes`) beats a later one (`overrides`, `utilities`)
// for `!important` declarations — see `'LoadingSkeleton recipes !important beats
// utilities-layer !important overrides'` in `layer-order.browser.test.ts`. Direct `@layer
// recipes` is the only place in this layer stack where `!important` sorts the way this component
// needs on both counts. Do not move this back into `stylex.create` without re-deriving that
// ordering; see `stylesheet-contract.test.ts`'s guard against `!important` in
// `recipes.priorityN`.
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
