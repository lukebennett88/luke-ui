import type { Preferences } from './preferences/schema.js';

export type SettingsOutletContext = {
	preferences: Preferences;
	isPreferencesPending: boolean;
	preferencesError?: string;
	resetPreferencesStatus: () => void;
	savePreferences: (patch: Partial<Preferences>) => void;
};
