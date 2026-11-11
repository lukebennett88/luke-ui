import { useOutletContext } from 'react-router';
import type { SettingsOutletContext } from '../settings-outlet-context.js';
import { SettingsPage } from '../settings-section.js';
import { ClearSavedSettingsSection } from './clear-saved-settings-section.js';

export function SecurityPage() {
	const { resetPreferencesStatus } = useOutletContext<SettingsOutletContext>();

	return (
		<SettingsPage title="Security & access">
			<ClearSavedSettingsSection onCleared={resetPreferencesStatus} />
		</SettingsPage>
	);
}
