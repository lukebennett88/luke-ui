import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';
import { TextField } from '@luke-ui/react/text-field';
import { useForm } from '@tanstack/react-form';
import { useEffect, useRef } from 'react';
import { useFetcher, useOutletContext } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';
import { profileUpdateSchema } from '../api/schemas.js';
import type { ProfileUpdate } from '../api/schemas.js';
import { settingsApi } from '../api/settings-api.js';
import {
	SettingsAvatarActions,
	SettingsPage,
	SettingsRow,
	SettingsSection,
	SettingsStatus,
	fieldErrorMessage,
} from '../components/settings-section.js';
import * as styles from '../styles/settings.css.js';
import { SaveButton } from './settings-layout.js';
import type { SettingsOutletContext } from './settings-layout.js';

export async function profileAction({ request }: ActionFunctionArgs) {
	const payload = profileUpdateSchema.parse(await request.json());
	try {
		const settings = await settingsApi.updateProfile(payload);
		return { ok: true as const, settings };
	} catch (error) {
		if (error instanceof Response) {
			const body = await error.json();
			return { ok: false as const, ...body };
		}
		return {
			ok: false as const,
			formError: error instanceof Error ? error.message : 'Save failed',
		};
	}
}

export function ProfilePage() {
	const { settings } = useOutletContext<SettingsOutletContext>();
	const fetcher = useFetcher<typeof profileAction>();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const isPending = fetcher.state !== 'idle';

	const form = useForm({
		defaultValues: {
			avatarDataUrl: settings.profile.avatarDataUrl,
			displayName: settings.profile.displayName,
			username: settings.profile.username,
		} satisfies ProfileUpdate,
		onSubmit: async ({ value }) => {
			void fetcher.submit(value, {
				encType: 'application/json',
				method: 'post',
			});
		},
		validators: {
			onChange: profileUpdateSchema,
		},
	});

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.ok) {
			const profile = fetcher.data.settings.profile;
			form.reset({
				avatarDataUrl: profile.avatarDataUrl,
				displayName: profile.displayName,
				username: profile.username,
			});
		}
	}, [fetcher.data, fetcher.state, form]);

	useEffect(() => {
		form.reset({
			avatarDataUrl: settings.profile.avatarDataUrl,
			displayName: settings.profile.displayName,
			username: settings.profile.username,
		});
	}, [
		settings.profile.avatarDataUrl,
		settings.profile.displayName,
		settings.profile.username,
		form,
	]);

	function readAvatar(file: File) {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === 'string') {
				form.setFieldValue('avatarDataUrl', reader.result);
			}
		};
		reader.readAsDataURL(file);
	}

	const actionError =
		fetcher.data && !fetcher.data.ok
			? ('formError' in fetcher.data && fetcher.data.formError) ||
				('fieldErrors' in fetcher.data &&
					fetcher.data.fieldErrors &&
					Object.values(fetcher.data.fieldErrors)[0]) ||
				'Save failed'
			: null;

	return (
		<SettingsPage title="Profile">
			<form
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<SettingsSection description="How you appear across the workspace." title="Identity">
					<form.Field name="avatarDataUrl">
						{(field) => (
							<SettingsRow hint="Shown next to your name and comments." label="Avatar">
								<SettingsAvatarActions>
									{field.state.value ? (
										<img alt="" className={styles.avatar} src={field.state.value} />
									) : (
										<div aria-hidden="true" className={styles.avatar} />
									)}
									<input
										accept="image/*"
										hidden
										onChange={(event) => {
											const file = event.target.files?.[0];
											if (file) readAvatar(file);
										}}
										ref={fileInputRef}
										type="file"
									/>
									<Button
										onPress={() => fileInputRef.current?.click()}
										prominence="standard"
										tone="neutral"
										type="button"
									>
										Change
									</Button>
									<Button
										isDisabled={!field.state.value}
										onPress={() => field.handleChange(null)}
										prominence="low"
										tone="neutral"
										type="button"
									>
										Remove
									</Button>
								</SettingsAvatarActions>
							</SettingsRow>
						)}
					</form.Field>
					<form.Field name="displayName">
						{(field) => (
							<SettingsRow label="Preferred name">
								<TextField
									aria-label="Preferred name"
									errorMessage={fieldErrorMessage(field.state.meta.errors[0])}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(value) => field.handleChange(value)}
									size="small"
									value={field.state.value}
								/>
							</SettingsRow>
						)}
					</form.Field>
					<form.Field name="username">
						{(field) => (
							<SettingsRow hint="Lowercase letters, numbers, and hyphens." label="Username">
								<TextField
									aria-label="Username"
									errorMessage={fieldErrorMessage(field.state.meta.errors[0])}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(value) => field.handleChange(value)}
									size="small"
									value={field.state.value}
								/>
							</SettingsRow>
						)}
					</form.Field>
					<SettingsRow hint="Managed by your workspace." label="Email">
						<Text color="secondary">{settings.profile.email}</Text>
					</SettingsRow>
				</SettingsSection>
				<form.Subscribe selector={(state) => [state.canSubmit, state.isDirty] as const}>
					{([canSubmit, isDirty]) => (
						<SaveButton isDirty={Boolean(isDirty && canSubmit)} isPending={isPending} />
					)}
				</form.Subscribe>
				{isPending ? <SettingsStatus>Saving…</SettingsStatus> : null}
				{fetcher.data?.ok ? <SettingsStatus tone="success">Profile saved.</SettingsStatus> : null}
				{actionError ? (
					<SettingsStatus role="alert" tone="danger">
						{String(actionError)}
					</SettingsStatus>
				) : null}
			</form>
		</SettingsPage>
	);
}
