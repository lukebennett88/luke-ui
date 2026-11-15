import { useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();

/** The current query string. Re-renders on navigation, back, and forward. */
export function useLocationSearch(): string {
	return useSyncExternalStore(subscribe, getSearch);
}

/** Client-side navigation to a same-origin href, such as `?pr=12`. */
export function navigate(href: string, options: { replace?: boolean } = {}): void {
	const url = new URL(href, window.location.href);
	if (url.href === window.location.href) return;
	if (options.replace) window.history.replaceState(null, '', url);
	else window.history.pushState(null, '', url);
	for (const listener of listeners) listener();
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

function subscribe(listener: () => void) {
	listeners.add(listener);
	window.addEventListener('popstate', listener);
	return () => {
		listeners.delete(listener);
		window.removeEventListener('popstate', listener);
	};
}

function getSearch() {
	return window.location.search;
}
