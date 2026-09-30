import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider, redirect } from 'react-router';
import { page, userEvent } from 'vite-plus/test/context';
import { settingsApi } from '../api/settings-api.js';
import { SettingsLayout } from '../routes/settings-layout.js';
import { settingsLoader, settingsPageRoutes } from '../routes/settings-routes.js';

function createTestRouter(initialEntries: Array<string> = ['/settings/preferences']) {
	return createMemoryRouter(
		[
			{
				children: [
					{
						HydrateFallback: () => null,
						index: true,
						loader: () => redirect('/settings/preferences'),
					},
					...settingsPageRoutes.map((route) => ({
						...route,
						HydrateFallback: () => null,
					})),
				],
				element: <SettingsLayout />,
				HydrateFallback: () => null,
				id: 'settings',
				loader: settingsLoader,
				path: '/settings',
			},
		],
		{ initialEntries },
	);
}

export function renderApp(initialEntries?: Array<string>) {
	settingsApi.setLatency(0);
	const container = document.body.appendChild(document.createElement('div'));
	const root = createRoot(container);
	const router = createTestRouter(initialEntries);

	act(() => {
		root.render(<RouterProvider router={router} />);
	});

	return {
		container,
		locator: page.elementLocator(container),
		router,
		unmount: () => {
			act(() => root.unmount());
			container.remove();
		},
		user: userEvent,
	};
}
