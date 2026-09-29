import { Button } from '@luke-ui/react/button';
import { useForm } from '@tanstack/react-form';
import { useEffect, useId, useRef } from 'react';
import { useFetcher, useOutletContext } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';
import { profileUpdateSchema } from '../api/schemas.js';
import type { ProfileUpdate } from '../api/schemas.js';
import { settingsApi } from '../api/settings-api.js';
import { SettingsRow, SettingsSection } from '../components/settings-section.js';
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
	const nameId = useId();
	const usernameId = useId();
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
		<>
			<h1 className="settings-page-title">Profile</h1>
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
								<div className="settings-avatar-actions">
									{field.state.value ? (
										<img alt="" className="settings-avatar" src={field.state.value} />
									) : (
										<div aria-hidden="true" className="settings-avatar" />
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
								</div>
							</SettingsRow>
						)}
					</form.Field>
					<form.Field name="displayName">
						{(field) => (
							<SettingsRow label="Preferred name">
								<input
									aria-invalid={field.state.meta.errors.length > 0}
									aria-label="Preferred name"
									className="settings-native-input"
									id={nameId}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									value={field.state.value}
								/>
							</SettingsRow>
						)}
					</form.Field>
					<form.Field name="username">
						{(field) => (
							<SettingsRow hint="Lowercase letters, numbers, and hyphens." label="Username">
								<input
									aria-invalid={field.state.meta.errors.length > 0}
									aria-label="Username"
									className="settings-native-input"
									id={usernameId}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									value={field.state.value}
								/>
							</SettingsRow>
						)}
					</form.Field>
					<SettingsRow hint="Managed by your workspace." label="Email">
						<span className="settings-row-value">{settings.profile.email}</span>
					</SettingsRow>
				</SettingsSection>
				<form.Subscribe selector={(state) => [state.canSubmit, state.isDirty] as const}>
					{([canSubmit, isDirty]) => (
						<SaveButton isDirty={Boolean(isDirty && canSubmit)} isPending={isPending} />
					)}
				</form.Subscribe>
				{isPending ? (
					<p className="settings-status" role="status">
						Saving…
					</p>
				) : null}
				{fetcher.data?.ok ? (
					<p className="settings-status" data-tone="success" role="status">
						Profile saved.
					</p>
				) : null}
				{actionError ? (
					<p className="settings-status" data-tone="danger" role="alert">
						{String(actionError)}
					</p>
				) : null}
			</form>
		</>
	);
}
