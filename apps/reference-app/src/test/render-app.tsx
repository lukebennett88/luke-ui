import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { page, userEvent } from 'vite-plus/test/context';
import { createAppRoutes } from '../routes/app-routes.js';

export async function renderApp(initialEntries: Array<string> = ['/settings/preferences']) {
	const container = document.body.appendChild(document.createElement('div'));
	container.id = 'reference-app-test-root';
	const root = createRoot(container);
	const queryClient = new QueryClient();
	const router = createMemoryRouter(createAppRoutes(queryClient), { initialEntries });
	await act(async () => {
		root.render(
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
			</QueryClientProvider>,
		);
		if (router.state.initialized) return;
		await new Promise<void>((resolve) => {
			const unsubscribe = router.subscribe((state) => {
				if (!state.initialized) return;
				unsubscribe();
				resolve();
			});
		});
	});

	function unmount() {
		if (!mountedApps.delete(unmount)) return;
		act(() => root.unmount());
		router.dispose();
		queryClient.clear();
		container.remove();
	}
	mountedApps.add(unmount);

	return {
		container,
		locator: page.elementLocator(container),
		router,
		unmount,
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

const mountedApps = new Set<() => void>();

export function cleanupApps() {
	for (const unmount of mountedApps) unmount();
}
