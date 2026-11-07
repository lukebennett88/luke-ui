import type { AnyRouter } from '@tanstack/react-router';

type ViewTransitionOptions = Exclude<
	AnyRouter['options']['defaultViewTransition'],
	boolean | undefined
>;

/**
 * The View Transition type a route change carries. CSS keys the header's `view-transition-name`s
 * and the neutral root on it with `:active-view-transition-type`, so no other transition (such as
 * the search morph) picks them up.
 */
export const ROUTE_VIEW_TRANSITION_TYPE = 'route';

/**
 * The router's `defaultViewTransition`. The router wraps each navigation in
 * `document.startViewTransition`, and the commit happens inside it. React's own `<ViewTransition>`
 * does not fire here, because TanStack Router commits through external stores, which React never
 * treats as a transition.
 *
 * `false` leaves the swap instant. That covers browsers with no support for transition types,
 * where the router would otherwise run an unscoped root cross-fade, and visitors who prefer
 * reduced motion, so they get no motion at all. A navigation that keeps the path, such as a hash
 * change, does not animate. The preference is read on each navigation, so changing it takes effect
 * without a reload.
 */
export function getRouteViewTransition(): ViewTransitionOptions | false {
	if (typeof CSS === 'undefined' || !CSS.supports('selector(:active-view-transition-type(a))')) {
		return false;
	}
	return {
		types: ({ fromLocation, pathChanged }: { fromLocation?: unknown; pathChanged: boolean }) => {
			if (!fromLocation || !pathChanged) return false;
			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
			return [ROUTE_VIEW_TRANSITION_TYPE];
		},
	};
}
