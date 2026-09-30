import type { QueryClient } from '@tanstack/react-query';
import { settingsQueryOptions } from '../api/settings-query.js';
import { PreferencesPage } from './preferences.js';
import { ProfilePage } from './profile.js';
import { SecurityPage } from './security.js';
import { SettingsMenuPage } from './settings-layout.js';

export async function settingsLoader(queryClient: QueryClient) {
	await queryClient.query(settingsQueryOptions);
}

export const settingsPageRoutes = [
	{
		element: <SettingsMenuPage />,
		path: 'menu',
	},
	{
		element: <PreferencesPage />,
		path: 'preferences',
	},
	{
		element: <ProfilePage />,
		path: 'profile',
	},
	{
		element: <SecurityPage />,
		path: 'security',
	},
];
