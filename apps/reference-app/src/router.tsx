import { createBrowserRouter, redirect, RouterProvider } from 'react-router';
import { applyInterfaceSettings, settingsApi } from './api/settings-api.js';
import { AccountPage, accountAction } from './routes/account.js';
import { InterfacePage, interfaceAction } from './routes/interface.js';
import { PreferencesPage, preferencesAction } from './routes/preferences.js';
import { ProfilePage, profileAction } from './routes/profile.js';
import { SettingsLayout, SettingsMenuPage } from './routes/settings-layout.js';

async function settingsLoader() {
	const settings = await settingsApi.getSettings();
	applyInterfaceSettings(settings.interface);
	return { settings };
}

const router = createBrowserRouter([
	{
		path: '/',
		loader: () => redirect('/settings/profile'),
	},
	{
		HydrateFallback: () => null,
		path: '/settings',
		id: 'settings',
		element: <SettingsLayout />,
		loader: settingsLoader,
		shouldRevalidate: ({ formMethod, defaultShouldRevalidate }) => {
			if (formMethod && formMethod !== 'GET') return true;
			return defaultShouldRevalidate;
		},
		children: [
			{ index: true, loader: () => redirect('profile') },
			{
				path: 'menu',
				element: <SettingsMenuPage />,
			},
			{
				path: 'profile',
				element: <ProfilePage />,
				action: profileAction,
			},
			{
				path: 'preferences',
				element: <PreferencesPage />,
				action: preferencesAction,
			},
			{
				path: 'interface',
				element: <InterfacePage />,
				action: interfaceAction,
			},
			{
				path: 'account',
				element: <AccountPage />,
				action: accountAction,
			},
		],
	},
]);

export function AppRouter() {
	return <RouterProvider router={router} />;
}
