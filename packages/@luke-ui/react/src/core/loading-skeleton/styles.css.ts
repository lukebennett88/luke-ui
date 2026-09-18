import type { StyleRule } from '@vanilla-extract/css';
import { createVar, fallbackVar, keyframes } from '@vanilla-extract/css';
import { vars } from '../../theme/contract.css.js';
import { globalStyleInLayer, style } from '../styles/layered-style.css.js';

// Registered so the browser can interpolate it: an unregistered custom property cannot animate
// smoothly, it only ever switches at a keyframe boundary. Inherited so every descendant reads the
// one value the root animates, instead of each element running its own copy of the animation.
//
// The animation runs this property from -200% to 100%; direction is decided separately, at the point
// every surface below reads it into a physical `background-position-x`. That keeps exactly one
// keyframes definition and one animated property for both writing modes, rather than a mirrored
// keyframes per direction.
//
// The range is tied to `sheenBackgroundSize`: at a 200% size the gradient image is two box-widths
// wide and its highlight peak sits one box-width in, so a `background-position-x` of 200% parks the
// peak just off the inline-start edge and -100% parks it just past the inline-end edge. Widening the
// band without widening this range strands the highlight off-box for most of the cycle, which reads
// as a skeleton that is static most of the time.
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

// The sheen is a highlight band lifted off the base colour, mixed in OKLab so it stays colour-derived.
// The mix is deliberately strong: the base skeleton colour is already a light grey, so mixing toward
// white moves it very little. Measured against the painted result, a 12% mix shifted the surface by
// only ~10/255 and read as flat; 35% shifts it ~29/255, which is visible without being harsh. `@supports`
// falls back to the flat base colour in a browser that lacks `color-mix()`, rather than leaving the
// surface transparent or unpainted.
const skeletonBase = vars.color.loadingSkeleton;
const skeletonHighlight = `color-mix(in oklab, ${skeletonBase}, white 35%)`;

// Two box-widths, so the visible surface spans a full side of the gradient ramp at any instant. A
// wider band (the 400% this started at) flattens the ramp across the box: the edge-to-edge difference
// fell to roughly 5/255, indistinguishable from a flat fill. Keep this in step with the travel range
// on `sheenPositionVar` above.
const sheenBackgroundSize = '200% 100%';
const sheenGradient = `linear-gradient(to right, ${skeletonBase}, ${skeletonHighlight}, ${skeletonBase})`;

// `background-position` has no logical-property form, so the sheen's *travel* (the animated custom
// property above) stays direction-agnostic, and only the physical x position consuming it flips here.
// Increasing `background-position-x` slides the gradient image so its earlier (more leftward)
// content becomes visible, which moves the visible highlight band to the left — confirmed empirically
// against a plain two-stop gradient, not assumed from the property name. So LTR (inline-start to
// inline-end, i.e. left to right) needs a *decreasing* position as the animation progresses, hence the
// negation; the RTL scope then negates again to get the increasing, physically-rightward-to-leftward
// travel that reads as inline-start to inline-end in a right-to-left flow. Both read the same
// underlying 0%-to-100%-shaped animated value, so this stays one keyframes definition for both
// writing modes rather than a mirrored keyframes per direction.
const sheenPositionX = `calc(-1 * ${sheenPositionVar})`;
const sheenPositionXRtl = `calc(${sheenPositionVar})`;

// Matches an element that either carries `dir="rtl"` itself or descends from one (the usual place a
// document or section sets it), so the flip holds regardless of where a consumer puts the attribute.
// Appended directly to the target selector (not as a separate ancestor combinator) so it composes as
// "this element, under RTL" rather than requiring a distinct RTL-marked ancestor element.
// `:where()` keeps this at zero specificity, same as a plain attribute selector.
function underRtl(selector: string): string {
	return `${selector}:where([dir="rtl"], [dir="rtl"] *)`;
}

// Removes the animated gradient so the surface falls back to its flat `backgroundColor` (the base
// skeleton colour under reduced motion, `CanvasText` under forced colors, set alongside this below).
// Turning off `animation-name` alone is not enough: `surface`'s `@supports` block sets
// `background-image` and its position/size unconditionally, so without this the gradient keeps
// painting — frozen at `sheenPositionVar`'s `-100%` initial value, which reads as a static ramp
// (strong at inline-start, fading to nothing at inline-end) rather than the flat colour both of these
// modes require.
//
// Nested inside `surface`'s own `@supports` block below rather than a sibling `@media`:
// vanilla-extract does not preserve the source order between different at-rule types (a sibling
// `@media` compiled before the `@supports` it was meant to override, regardless of which object key
// came first — verified by inspecting the compiled stylesheet), so a sibling override could not be
// trusted to win. Nesting keeps this in the same conditional group as the gradient it overrides, where
// plain source order — the later declaration in the same block wins — is unambiguous.
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

// Forced onto every skeleton surface so an arbitrary wrapped component reads as a flat placeholder shape.
// `!important` is deliberate: cascade layers alone can't beat consumers' un-layered or inline styles, and the
// skeleton must always win over its children. The casts silence csstype on keyword-only properties, which don't
// admit the `!important` suffix in their type.
const surface = {
	backgroundClip: 'border-box !important',
	backgroundColor: `${skeletonBase} !important`,
	backgroundImage: 'none !important',
	border: 'none !important',
	// Text spanning multiple lines keeps its radius, gradient, and position in step on every line
	// fragment, so the sheen reads as one band sweeping across every line rather than a separate copy
	// per line.
	boxDecorationBreak: 'clone !important' as 'clone',
	boxShadow: 'none !important',
	color: 'transparent !important',
	cursor: 'default !important',
	outline: 'none !important',
	pointerEvents: 'none !important' as 'none',
	// A wrapped interactive element (Button, Checkbox, Combobox…) declares its own
	// `transition-property: background-color` for hover/press feedback. Left in place, that
	// transition intercepts every animation frame's background recalculation as if it were a
	// one-off style change, fighting the sheen instead of letting it read cleanly. The skeleton
	// paints a static placeholder, so it never needs a transition of its own.
	transitionProperty: 'none !important',
	userSelect: 'none !important' as 'none',

	'@media': {
		// `CanvasText` here (rather than only in the `@supports` block below) matches the pre-sheen
		// behaviour: a wrapped surface still reads as a flat forced-colors placeholder even in a
		// browser old enough to lack `color-mix()`.
		'(forced-colors: active)': forcedColorsSurface,
	},

	'@supports': {
		'(background-color: color-mix(in oklab, red, blue))': {
			backgroundImage: `${sheenGradient} !important`,
			backgroundPositionX: `${sheenPositionX} !important`,
			backgroundPositionY: '0px !important',
			// Without this the gradient tiles, so the box is never actually flat: a second copy of the
			// highlight sits on the surface while the first is still travelling, and the wrap back to the
			// start swaps one for the other in a single frame. That swap is the visible jitter at the loop
			// seam. With no tiling the band leaves the surface entirely before the cycle restarts, so the
			// restart lands on a genuinely flat surface and cannot be seen.
			backgroundRepeat: 'no-repeat !important',
			backgroundSize: `${sheenBackgroundSize} !important`,
			// See `flatSurface` above for why this lives nested here instead of as a sibling `@media`.
			'@media': {
				'(forced-colors: active)': { ...forcedColorsSurface, ...flatSurface },
				'(prefers-reduced-motion: reduce)': flatSurface,
			},
		},
	},
} as const satisfies StyleRule;

// Mirrors the sheen's physical direction under `underRtl()`. Layered on top of `surface` wherever it
// is applied, scoped to the same `@supports` gate so an unsupporting browser keeps the flat fallback
// colour in both directions. Reduced-motion and forced-colors are handled entirely inside `surface`'s
// own `@supports` block above, so this override never needs to interact with them.
const surfaceRtl = {
	'@supports': {
		'(background-color: color-mix(in oklab, red, blue))': {
			backgroundPositionX: `${sheenPositionXRtl} !important`,
		},
	},
} as const satisfies StyleRule;

// Only the root runs the animation; descendants inherit `sheenPositionVar` and read it in their own
// `background-position-x` above. Not `!important`: the reduced-motion override below must stay
// able to turn it off. The flat colour itself (`background-image` back to `none`, etc.) comes from
// `surface`'s nested `@supports > @media` above; this block only needs to stop the animation and (for
// forced colors) paint `CanvasText`.
const sheen = {
	animationDelay: '0.5s',
	animationDuration: '3s',
	animationIterationCount: 'infinite',
	animationName: skeletonAnimationName,
	// A travelling highlight reads as a moving light source, not an eased state change: linear
	// keeps its speed constant across the loop, so the sheen doesn't stutter at the 200%→-100% seam.
	// The gradient's own soft transparent-to-highlight-to-transparent stops already round off the
	// leading and trailing edges, which is where the old pulse used `vars.motion.easing.standard` to
	// get the same softness.
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
		// Inline mode: the element itself is the skeleton (used when wrapping text). It is the
		// animation root: nothing else in this mode reads `sheenPositionVar` from it.
		'&[data-skeleton-inline]': {
			...surface,
			...sheen,
			borderRadius: fallbackVar(skeletonRadiusVar, vars.radius.detail),
		},
		[underRtl('&[data-skeleton-inline]')]: surfaceRtl,
		// Block mode: the wrapper paints nothing (`display: contents`), but it stays the sole
		// animation root. A `display: contents` element keeps its computed style for inheritance
		// even though it has no box of its own, so `sheenPositionVar` still flows down to the children
		// styled below with no animation of their own.
		'&:not([data-skeleton-inline])': {
			...sheen,
			display: 'contents',
		},
	},
});

// The child's own background reads the wrapper's inherited `sheenPositionVar`, so it stays in step
// with the `::after` overlay below with no animation of its own; at a rounded corner its square edge
// would otherwise show through the overlay's rounded recess. Give it the same radius so both
// surfaces agree on the visible shape. `position: relative` still anchors the absolutely positioned
// `::after` overlay; nothing here depends on a `filter` containing block, so it stays unconditionally.
// `surface`'s own nested `@supports > @media` (see above) covers this child's reduced-motion and
// forced-colors fallback, since it reads `surface` directly and the `display: contents` root paints
// nothing of its own for this to reach instead.
globalStyleInLayer('structural', `${loadingSkeletonClassName}:not([data-skeleton-inline]) > *`, {
	...surface,
	borderRadius: fallbackVar(skeletonRadiusVar, '0px'),
	overflow: 'hidden !important',
	position: 'relative !important' as 'relative',
});

globalStyleInLayer(
	'structural',
	underRtl(`${loadingSkeletonClassName}:not([data-skeleton-inline]) > *`),
	surfaceRtl,
);

globalStyleInLayer('structural', `${loadingSkeletonClassName}:not([data-skeleton-inline]) > * *`, {
	...surface,
});

globalStyleInLayer(
	'structural',
	underRtl(`${loadingSkeletonClassName}:not([data-skeleton-inline]) > * *`),
	surfaceRtl,
);

// A pseudo-element painted over the child covers visuals the forced styles can't reach (nested backgrounds,
// rounded corners); `inset: -1px` also covers the child's border box edges. Its box is 2px larger than the
// child's on each axis (the `-1px` inset), so its background-position percentage resolves against a very
// slightly different size than the child's own — imperceptible in practice, and still driven by the same
// inherited `sheenPositionVar` so both surfaces move together rather than showing two offset highlights.
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

// `:where(...)` composes onto the `*` here, ahead of `::after`, rather than after the pseudo-element:
// chaining a structural pseudo-class after a pseudo-element is not reliable across engines.
globalStyleInLayer(
	'structural',
	`${underRtl(`${loadingSkeletonClassName}:not([data-skeleton-inline]) > *`)}::after`,
	surfaceRtl,
);
