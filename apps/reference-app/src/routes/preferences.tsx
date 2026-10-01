import { useOutletContext } from 'react-router';
import type { Preferences } from '../api/schemas.js';
import {
	SettingsPage,
	SettingsRow,
	SettingsSection,
	SettingsStatus,
} from '../components/settings-section.js';
import { SettingsSelect } from '../components/settings-select.js';
import { SettingsSwitch } from '../components/settings-switch.js';
import type { PrefRow } from './preferences-config.js';
import { INTERFACE_PREFS } from './preferences-config.js';
import type { SettingsOutletContext } from './settings-layout.js';

export function PreferencesPage() {
	const {
		preferences: values,
		isPreferencesPending,
		preferencesError,
		savePreferences,
	} = useOutletContext<SettingsOutletContext>();

	return (
		<SettingsPage title="Preferences">
			<SettingsSection title="Appearance">
				{INTERFACE_PREFS.map((pref) => (
					<PreferenceRow
						isPending={isPreferencesPending}
						key={pref.key}
						onSave={savePreferences}
						pref={pref}
						values={values}
					/>
				))}
			</SettingsSection>
			<SettingsStatus
				role={preferencesError ? 'alert' : 'status'}
				tone={preferencesError ? 'danger' : undefined}
			>
				{(() => {
					if (isPreferencesPending) return 'Saving…';
					if (preferencesError) return preferencesError;
					return null;
				})()}
			</SettingsStatus>
		</SettingsPage>
	);
}

function PreferenceRow({
	isPending,
	onSave,
	pref,
	values,
}: {
	isPending: boolean;
	onSave: (patch: Partial<Preferences>) => void;
	pref: PrefRow;
	values: Preferences;
}) {
	const descriptionId = pref.hint ? `${pref.id}-description` : undefined;

	if (pref.kind === 'select') {
		return (
			<SettingsRow descriptionId={descriptionId} hint={pref.hint} label={pref.label}>
				<SettingsSelect
					aria-describedby={descriptionId}
					id={pref.id}
					isPending={isPending}
					label={pref.label}
					onChange={(value) => onSave({ [pref.key]: pref.parse(value) })}
					options={[...pref.options]}
					value={values[pref.key]}
				/>
			</SettingsRow>
		);
	}

	return (
		<SettingsRow descriptionId={descriptionId} hint={pref.hint} label={pref.label}>
			<SettingsSwitch
				aria-describedby={descriptionId}
				id={pref.id}
				isChecked={values[pref.key]}
				isReadOnly={isPending}
				label={pref.label}
				onChange={(checked) => onSave({ [pref.key]: checked })}
			/>
		</SettingsRow>
	);
}
