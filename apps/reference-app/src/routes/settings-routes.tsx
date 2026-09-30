import { applyInterfaceSettings, settingsApi } from '../api/settings-api.js';
import { PreferencesPage, preferencesAction } from './preferences.js';
import { ProfilePage, profileAction } from './profile.js';
import { SecurityPage, securityAction } from './security.js';
import { SettingsMenuPage } from './settings-layout.js';

export async function settingsLoader() {
	const settings = await settingsApi.getSettings();
	applyInterfaceSettings(settings.preferences);
	return { settings };
}

export const settingsPageRoutes = [
	{
		element: <SettingsMenuPage />,
		path: 'menu',
	},
	{
		action: preferencesAction,
		element: <PreferencesPage />,
		path: 'preferences',
	},
	{
		action: profileAction,
		element: <ProfilePage />,
		path: 'profile',
	},
	{
		action: securityAction,
		element: <SecurityPage />,
		path: 'security',
	},
];
