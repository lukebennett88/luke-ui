import { SelectField, SelectItem } from '@luke-ui/react/select-field';
import { useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router';
import type { Preferences } from '../api/schemas.js';
import {
	SettingsPage,
	SettingsRow,
	SettingsSection,
	SettingsStatus,
} from '../components/settings-section.js';
import { SettingsSwitch } from '../components/settings-switch.js';
import * as styles from '../styles/settings.css.js';
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
			<SelectPreferenceRow isPending={isPending} onSave={onSave} pref={pref} values={values} />
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

function SelectPreferenceRow({
	isPending,
	onSave,
	pref,
	values,
}: {
	isPending: boolean;
	onSave: (patch: Partial<Preferences>) => void;
	pref: Extract<PrefRow, { kind: 'select' }>;
	values: Preferences;
}) {
	const triggerRef = useRef<HTMLButtonElement>(null);
	const shouldRestoreFocus = useRef(false);
	const labelId = `${pref.id}-label`;
	const descriptionId = pref.hint ? `${pref.id}-description` : undefined;

	// The select is disabled while a save is in flight, and a disabled button cannot hold focus, so
	// focus falls to the body when the listbox closes. Return it to the trigger once the save
	// settles, but only while nothing else has taken focus in the meantime.
	useEffect(() => {
		if (isPending || !shouldRestoreFocus.current) return;
		shouldRestoreFocus.current = false;
		const { activeElement } = document;
		if (activeElement && activeElement !== document.body) return;
		triggerRef.current?.focus();
	}, [isPending]);

	return (
		<SettingsRow
			descriptionId={descriptionId}
			hint={pref.hint}
			label={pref.label}
			labelId={labelId}
		>
			<SelectField
				aria-describedby={descriptionId}
				aria-labelledby={labelId}
				className={styles.settingsSelect}
				isDisabled={isPending}
				items={pref.options}
				onChange={(key) => {
					if (key == null) return;
					shouldRestoreFocus.current = true;
					onSave({ [pref.key]: pref.parse(String(key)) });
				}}
				size="small"
				triggerId={pref.id}
				triggerRef={triggerRef}
				value={values[pref.key]}
			>
				{(option) => <SelectItem id={option.value}>{option.label}</SelectItem>}
			</SelectField>
		</SettingsRow>
	);
}
