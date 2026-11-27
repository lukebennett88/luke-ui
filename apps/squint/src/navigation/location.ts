import type { NavigateOptions } from '@tanstack/react-router';
import { useRouter, useRouterState } from '@tanstack/react-router';
import { useCallback } from 'react';

/** The current query string. Re-renders on navigation, back, and forward. */
export function useLocationSearch(): string {
	return useRouterState({ select: (state) => state.location.searchStr });
}

/**
 * Client-side navigation to another view of the app, such as `?pr=12`. Every view shares one path,
 * so an href to another path, such as the backend's `/api/auth/login`, loads that page instead.
 */
export function useNavigateHref(): (
	href: string,
	options?: Pick<NavigateOptions, 'replace' | 'resetScroll'>,
) => void {
	const router = useRouter();
	return useCallback(
		(href, options = {}) => {
			const url = new URL(href, window.location.href);
			if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) {
				window.location.assign(url);
				return;
			}
			if (url.href === window.location.href) return;
			void router.navigate({ href: `${url.pathname}${url.search}${url.hash}`, ...options });
		},
		[router],
	);
}

/** The href for the current page with `updates` applied. An `undefined` value removes its key. */
export function hrefWithParams(
	search: string,
	updates: Record<string, string | undefined>,
): string {
	const params = new URLSearchParams(search);
	for (const [key, value] of Object.entries(updates)) {
		if (value === undefined || value === '') params.delete(key);
		else params.set(key, value);
	}
	const next = params.toString();
	return next ? `?${next}` : window.location.pathname;
}
