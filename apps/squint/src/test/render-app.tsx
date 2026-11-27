import { createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { page, userEvent } from 'vite-plus/test/context';
import { App } from '../app.js';
import { searchOptions } from '../navigation/search.js';

const mountedApps = new Set<() => void>();

/**
 * Mounts the app at `search`, such as `?source=local`. The local source is the report drawn in
 * `fixture-report.ts`, served by the same development route the app uses outside tests. The router
 * has one route for `content`, on the browser's history, so the tests read the URL the app writes.
 */
export async function renderApp(search: string, content: ReactNode = <App />) {
	window.history.replaceState(null, '', `${window.location.pathname}${search}`);
	const router = createRouter({
		...searchOptions,
		routeTree: createRootRoute({ component: () => content }),
	});
	await router.load();
	const container = document.body.appendChild(document.createElement('div'));
	container.dataset.testid = 'app';
	const root = createRoot(container);
	await act(async () => {
		root.render(<RouterProvider router={router} />);
	});

	function unmount() {
		if (!mountedApps.delete(unmount)) return;
		act(() => root.unmount());
		container.remove();
	}
	mountedApps.add(unmount);

	return {
		container,
		// `elementLocator` resolves to the first `div` in the page, which stops being the container
		// once React Aria's live announcer adds its own `div` to the body.
		locator: page.getByTestId('app'),
		user: {
			click: (...args: Parameters<typeof userEvent.click>) => {
				return act(async () => {
					await userEvent.click(...args);
				});
			},
			fill: (...args: Parameters<typeof userEvent.fill>) => {
				return act(async () => {
					await userEvent.fill(...args);
				});
			},
			keyboard: (...args: Parameters<typeof userEvent.keyboard>) => {
				return act(async () => {
					await userEvent.keyboard(...args);
				});
			},
		},
	};
}

export function cleanupApps() {
	for (const unmount of mountedApps) unmount();
}
