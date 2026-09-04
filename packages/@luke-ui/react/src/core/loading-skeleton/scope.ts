/** Private attribute bridging LoadingSkeleton's StyleX root to its retained descendant masks. Implementation detail — not a public styling hook. */
export const loadingSkeletonScopeAttribute = 'data-luke-loading-skeleton';

/**
 * `@internal`. The custom property carrying the skeleton's corner radius from the `radius` prop
 * (set as an inline style in `loading-skeleton.tsx`) into the retained forced-surface CSS in
 * `styles.css.ts`. A plain string, not a StyleX const, so both modules can share it.
 */
export const skeletonRadiusVar = '--luke-loading-skeleton-radius';

/**
 * Stable animation name for the skeleton's pulse, shared by three consumers: the retained forced
 * surface in `styles.css.ts` (which defines both the `@keyframes` and every rule that plays it,
 * inline root included), `useSynchronizeAnimations` (which reads it at runtime to phase-align
 * every playing instance), and nothing else — `loading-skeleton.tsx` no longer authors any
 * `stylex.create` style that touches the pulse, so this can be a plain runtime string rather than
 * a StyleX-visible constant. Do not import this into a `stylex.create()` call: StyleX only
 * accepts constants it can statically resolve from the same module, so wiring this into StyleX
 * again would require reintroducing a module-local duplicate (see `loading-skeleton.tsx`'s
 * history) rather than importing it from here.
 */
export const skeletonPulseAnimationName = 'luke-loading-skeleton-pulse';
