import { useOutletContext } from 'react-router';
import { ClearSavedSettingsSection } from '../components/clear-saved-settings-section.js';
import { SettingsPage } from '../components/settings-section.js';
import type { SettingsOutletContext } from './settings-layout.js';

export function SecurityPage() {
	const { resetPreferencesStatus } = useOutletContext<SettingsOutletContext>();

	return (
		<SettingsPage title="Security & access">
			<ClearSavedSettingsSection onCleared={resetPreferencesStatus} />
		</SettingsPage>
	);
}
