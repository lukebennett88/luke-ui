import type { AnyRouter } from '@tanstack/react-router';

type ViewTransitionOptions = Exclude<
	AnyRouter['options']['defaultViewTransition'],
	boolean | undefined
>;

/** Scopes the header's route-change motion so other transitions, such as the search morph, skip it. */
export const ROUTE_VIEW_TRANSITION_TYPE = 'route';

/**
 * The router's `defaultViewTransition`. React's `<ViewTransition>` cannot do this: TanStack Router
 * commits through external stores, which React never treats as a transition.
 *
 * Browsers without transition types get `false`, because the router would otherwise run an unscoped
 * root cross-fade. Reduced motion is read per navigation, so changing it needs no reload.
 */
export function getRouteViewTransition(): ViewTransitionOptions | false {
	if (typeof CSS === 'undefined' || !CSS.supports('selector(:active-view-transition-type(a))')) {
		return false;
	}
	return {
		types: ({ fromLocation, pathChanged }) => {
			if (!fromLocation || !pathChanged) return false;
			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
			return [ROUTE_VIEW_TRANSITION_TYPE];
		},
	};
}
