import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter, redirect, RouterProvider } from 'react-router';
import { page, userEvent } from 'vite-plus/test/context';
import { applyInterfaceSettings, settingsApi } from '../api/settings-api.js';
import { AccountPage, accountAction } from '../routes/account.js';
import { InterfacePage, interfaceAction } from '../routes/interface.js';
import { PreferencesPage, preferencesAction } from '../routes/preferences.js';
import { ProfilePage, profileAction } from '../routes/profile.js';
import { SettingsLayout, SettingsMenuPage } from '../routes/settings-layout.js';

async function settingsLoader() {
	const settings = await settingsApi.getSettings();
	applyInterfaceSettings(settings.interface);
	return { settings };
}

function createTestRouter(initialEntries: Array<string> = ['/settings/profile']) {
	return createMemoryRouter(
		[
			{
				HydrateFallback: () => null,
				path: '/settings',
				id: 'settings',
				element: <SettingsLayout />,
				loader: settingsLoader,
				children: [
					{
						HydrateFallback: () => null,
						index: true,
						loader: () => redirect('/settings/profile'),
					},
					{
						HydrateFallback: () => null,
						path: 'menu',
						element: <SettingsMenuPage />,
					},
					{
						HydrateFallback: () => null,
						path: 'profile',
						element: <ProfilePage />,
						action: profileAction,
					},
					{
						HydrateFallback: () => null,
						path: 'preferences',
						element: <PreferencesPage />,
						action: preferencesAction,
					},
					{
						HydrateFallback: () => null,
						path: 'interface',
						element: <InterfacePage />,
						action: interfaceAction,
					},
					{
						HydrateFallback: () => null,
						path: 'account',
						element: <AccountPage />,
						action: accountAction,
					},
				],
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
