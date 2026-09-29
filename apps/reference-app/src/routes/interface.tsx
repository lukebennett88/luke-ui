import { useEffect } from 'react';
import { useFetcher, useOutletContext } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';
import { colorModeSchema, fontSizeSchema, interfaceSchema } from '../api/schemas.js';
import type { InterfaceSettings } from '../api/schemas.js';
import { applyInterfaceSettings, settingsApi } from '../api/settings-api.js';
import {
	SettingsPage,
	SettingsRow,
	SettingsSection,
	SettingsStatus,
} from '../components/settings-section.js';
import { SettingsSelect } from '../components/settings-select.js';
import { SettingsSwitch } from '../components/settings-switch.js';
import type { SettingsOutletContext } from './settings-layout.js';

export async function interfaceAction({ request }: ActionFunctionArgs) {
	const patch = interfaceSchema.partial().parse(await request.json());
	try {
		const settings = await settingsApi.updateInterface(patch);
		return { ok: true as const, settings };
	} catch (error) {
		return {
			ok: false as const,
			formError: error instanceof Error ? error.message : 'Could not save interface setting',
		};
	}
}

export function InterfacePage() {
	const { settings } = useOutletContext<SettingsOutletContext>();
	const fetcher = useFetcher<typeof interfaceAction>();
	const isPending = fetcher.state !== 'idle';
	const values = fetcher.data?.ok ? fetcher.data.settings.interface : settings.interface;

	useEffect(() => {
		if (fetcher.data?.ok) {
			applyInterfaceSettings(fetcher.data.settings.interface);
		}
	}, [fetcher.data]);

	function save(patch: Partial<InterfaceSettings>) {
		const next = { ...values, ...patch };
		applyInterfaceSettings(next);
		void fetcher.submit(patch, { encType: 'application/json', method: 'post' });
	}

	return (
		<SettingsPage title="Interface">
			<SettingsSection description="Appearance and interaction for this device." title="Theme">
				<SettingsRow label="Colour mode">
					<SettingsSelect
						disabled={isPending}
						id="color-mode"
						label="Colour mode"
						onChange={(value) => save({ colorMode: colorModeSchema.parse(value) })}
						options={[
							{ label: 'System', value: 'system' },
							{ label: 'Light', value: 'light' },
							{ label: 'Dark', value: 'dark' },
						]}
						value={values.colorMode}
					/>
				</SettingsRow>
				<SettingsRow label="Font size">
					<SettingsSelect
						disabled={isPending}
						id="font-size"
						label="Font size"
						onChange={(value) => save({ fontSize: fontSizeSchema.parse(value) })}
						options={[
							{ label: 'Small', value: 'small' },
							{ label: 'Default', value: 'default' },
							{ label: 'Large', value: 'large' },
						]}
						value={values.fontSize}
					/>
				</SettingsRow>
				<SettingsRow hint="Use a pointer cursor on interactive controls." label="Pointer cursor">
					<SettingsSwitch
						checked={values.pointerCursor}
						disabled={isPending}
						id="pointer-cursor"
						label="Pointer cursor"
						onChange={(checked) => save({ pointerCursor: checked })}
					/>
				</SettingsRow>
				<SettingsRow label="Underline links">
					<SettingsSwitch
						checked={values.underlineLinks}
						disabled={isPending}
						id="underline-links"
						label="Underline links"
						onChange={(checked) => save({ underlineLinks: checked })}
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
