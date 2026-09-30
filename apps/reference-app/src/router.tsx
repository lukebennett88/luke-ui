import { createBrowserRouter, RouterProvider, redirect } from 'react-router';
import { SettingsLayout } from './routes/settings-layout.js';
import { settingsLoader, settingsPageRoutes } from './routes/settings-routes.js';

function RedirectFallback() {
	return null;
}

const router = createBrowserRouter([
	{
		Component: RedirectFallback,
		HydrateFallback: RedirectFallback,
		loader: () => redirect('/settings/preferences'),
		path: '/',
	},
	{
		children: [
			{
				Component: RedirectFallback,
				HydrateFallback: RedirectFallback,
				index: true,
				loader: () => redirect('preferences'),
			},
			...settingsPageRoutes,
		],
		element: <SettingsLayout />,
		HydrateFallback: RedirectFallback,
		id: 'settings',
		loader: settingsLoader,
		path: '/settings',
		shouldRevalidate: ({ formMethod, defaultShouldRevalidate }) => {
			if (formMethod && formMethod !== 'GET') return true;
			return defaultShouldRevalidate;
		},
	},
]);

export function AppRouter() {
	return <RouterProvider router={router} />;
}
