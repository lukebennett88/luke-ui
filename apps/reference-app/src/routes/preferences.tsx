import { useFetcher, useOutletContext } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';
import { firstDaySchema, homeViewSchema, preferencesSchema } from '../api/schemas.js';
import type { Preferences } from '../api/schemas.js';
import { settingsApi } from '../api/settings-api.js';
import {
	SettingsPage,
	SettingsRow,
	SettingsSection,
	SettingsStatus,
} from '../components/settings-section.js';
import { SettingsSelect } from '../components/settings-select.js';
import { SettingsSwitch } from '../components/settings-switch.js';
import type { SettingsOutletContext } from './settings-layout.js';

export async function preferencesAction({ request }: ActionFunctionArgs) {
	const patch = preferencesSchema.partial().parse(await request.json());
	try {
		const settings = await settingsApi.updatePreferences(patch);
		return { ok: true as const, settings };
	} catch (error) {
		return {
			ok: false as const,
			formError: error instanceof Error ? error.message : 'Could not save preference',
		};
	}
}

export function PreferencesPage() {
	const { settings } = useOutletContext<SettingsOutletContext>();
	const fetcher = useFetcher<typeof preferencesAction>();
	const isPending = fetcher.state !== 'idle';
	const values = fetcher.data?.ok ? fetcher.data.settings.preferences : settings.preferences;

	function save(patch: Partial<Preferences>) {
		void fetcher.submit(patch, { encType: 'application/json', method: 'post' });
	}

	return (
		<SettingsPage title="Preferences">
			<SettingsSection description="Personal defaults for how the product behaves." title="General">
				<SettingsRow label="Default home view">
					<SettingsSelect
						disabled={isPending}
						id="home-view"
						label="Default home view"
						onChange={(value) => save({ homeView: homeViewSchema.parse(value) })}
						options={[
							{ label: 'Inbox', value: 'inbox' },
							{ label: 'My issues', value: 'my-issues' },
							{ label: 'Active', value: 'active' },
							{ label: 'Board', value: 'board' },
						]}
						value={values.homeView}
					/>
				</SettingsRow>
				<SettingsRow hint="Show full names instead of usernames." label="Display full names">
					<SettingsSwitch
						checked={values.displayFullNames}
						disabled={isPending}
						id="display-full-names"
						label="Display full names"
						onChange={(checked) => save({ displayFullNames: checked })}
					/>
				</SettingsRow>
				<SettingsRow label="First day of week">
					<SettingsSelect
						disabled={isPending}
						id="first-day"
						label="First day of week"
						onChange={(value) => save({ firstDayOfWeek: firstDaySchema.parse(value) })}
						options={[
							{ label: 'Monday', value: 'monday' },
							{ label: 'Sunday', value: 'sunday' },
						]}
						value={values.firstDayOfWeek}
					/>
				</SettingsRow>
				<SettingsRow hint="Turn :) into an emoji while typing." label="Convert emoticons to emoji">
					<SettingsSwitch
						checked={values.convertEmoticons}
						disabled={isPending}
						id="convert-emoticons"
						label="Convert emoticons to emoji"
						onChange={(checked) => save({ convertEmoticons: checked })}
					/>
				</SettingsRow>
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
