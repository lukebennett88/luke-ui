import { useEffect } from 'react';
import type { ActionFunctionArgs } from 'react-router';
import { useFetcher, useOutletContext } from 'react-router';
import { toActionError } from '../api/action-error.js';
import type { Preferences } from '../api/schemas.js';
import { preferencesSchema } from '../api/schemas.js';
import { applyInterfaceSettings, settingsApi } from '../api/settings-api.js';
import {
	SettingsPage,
	SettingsRow,
	SettingsSection,
	SettingsStatus,
} from '../components/settings-section.js';
import { SettingsSelect } from '../components/settings-select.js';
import { SettingsSwitch } from '../components/settings-switch.js';
import type { PrefRow } from './preferences-config.js';
import {
	AUTOMATION_PREFS,
	DESKTOP_PREFS,
	GENERAL_PREFS,
	INTERFACE_KEYS,
	INTERFACE_PREFS,
} from './preferences-config.js';
import type { SettingsOutletContext } from './settings-layout.js';

export async function preferencesAction({ request }: ActionFunctionArgs) {
	const patch = preferencesSchema.partial().parse(await request.json());
	try {
		const settings = await settingsApi.updatePreferences(patch);
		return { ok: true as const, settings };
	} catch (error) {
		return toActionError(error, 'Could not save preference');
	}
}

export function PreferencesPage() {
	const { settings } = useOutletContext<SettingsOutletContext>();
	const fetcher = useFetcher<typeof preferencesAction>();
	const isPending = fetcher.state !== 'idle';
	const values = fetcher.data?.ok ? fetcher.data.settings.preferences : settings.preferences;

	useEffect(() => {
		if (fetcher.data?.ok) {
			applyInterfaceSettings(fetcher.data.settings.preferences);
		}
	}, [fetcher.data]);

	function save(patch: Partial<Preferences>) {
		if (touchesInterface(patch)) {
			applyInterfaceSettings({ ...values, ...patch });
		}
		void fetcher.submit(patch, { encType: 'application/json', method: 'post' });
	}

	return (
		<SettingsPage title="Preferences">
			<SettingsSection title="General">
				{GENERAL_PREFS.map((pref) => (
					<PreferenceRow
						isPending={isPending}
						key={pref.key}
						onSave={save}
						pref={pref}
						values={values}
					/>
				))}
			</SettingsSection>

			<SettingsSection title="Interface and theme">
				{INTERFACE_PREFS.map((pref) => (
					<PreferenceRow
						isPending={isPending}
						key={pref.key}
						onSave={save}
						pref={pref}
						values={values}
					/>
				))}
			</SettingsSection>

			<SettingsSection title="Desktop application">
				{DESKTOP_PREFS.map((pref) => (
					<PreferenceRow
						isPending={isPending}
						key={pref.key}
						onSave={save}
						pref={pref}
						values={values}
					/>
				))}
			</SettingsSection>

			<SettingsSection title="Automations and workflows">
				{AUTOMATION_PREFS.map((pref) => (
					<PreferenceRow
						isPending={isPending}
						key={pref.key}
						onSave={save}
						pref={pref}
						values={values}
					/>
				))}
			</SettingsSection>

			{isPending ? <SettingsStatus>Saving…</SettingsStatus> : null}
			{fetcher.data && !fetcher.data.ok ? (
				<SettingsStatus role="alert" tone="danger">
					{fetcher.data.formError}
				</SettingsStatus>
			) : null}
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
	if (pref.kind === 'select') {
		return (
			<SettingsRow hint={pref.hint} label={pref.label}>
				<SettingsSelect
					id={pref.id}
					isDisabled={isPending}
					label={pref.label}
					onChange={(value) => onSave({ [pref.key]: pref.parse(value) })}
					options={[...pref.options]}
					value={String(values[pref.key])}
				/>
			</SettingsRow>
		);
	}

	return (
		<SettingsRow hint={pref.hint} label={pref.label}>
			<SettingsSwitch
				id={pref.id}
				isChecked={Boolean(values[pref.key])}
				isDisabled={isPending}
				label={pref.label}
				onChange={(checked) => onSave({ [pref.key]: checked })}
			/>
		</SettingsRow>
	);
}

function touchesInterface(patch: Partial<Preferences>) {
	return INTERFACE_KEYS.some((key) => key in patch);
}
