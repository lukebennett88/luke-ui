import { Icon } from '@luke-ui/react/icon';
import { Text } from '@luke-ui/react/text';
import { useEffect, useReducer, useRef } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import { Menu, MenuItem, MenuTrigger } from 'react-aria-components/Menu';
import { Popover } from 'react-aria-components/Popover';
import type { ActionFunctionArgs } from 'react-router';
import { useFetcher, useOutletContext } from 'react-router';
import { toActionError } from '../api/action-error.js';
import type { ProfileUpdate } from '../api/schemas.js';
import { profileLeaveActionSchema, profileUpdateSchema } from '../api/schemas.js';
import { settingsApi } from '../api/settings-api.js';
import { DestructiveConfirmSection } from '../components/destructive-confirm-section.js';
import { ProfileFieldDialog } from '../components/profile-field-dialog.js';
import {
	SettingsPage,
	SettingsRow,
	SettingsSection,
	SettingsStatus,
} from '../components/settings-section.js';
import * as styles from '../styles/settings.css.js';
import {
	destructiveConfirmReducer,
	initialDestructiveConfirmState,
} from '../workflows/destructive-confirm.js';
import type { SettingsOutletContext } from './settings-layout.js';

export async function profileAction({ request }: ActionFunctionArgs) {
	const body = await request.json();
	const leave = profileLeaveActionSchema.safeParse(body);
	if (leave.success) {
		try {
			await settingsApi.clearLocalSettings();
			return { left: true as const, ok: true as const };
		} catch (error) {
			return toActionError(error, 'Could not leave workspace');
		}
	}

	const payload = profileUpdateSchema.parse(body);
	try {
		const settings = await settingsApi.updateProfile(payload);
		return { ok: true as const, settings };
	} catch (error) {
		return toActionError(error, 'Save failed');
	}
}

export function ProfilePage() {
	const { settings } = useOutletContext<SettingsOutletContext>();
	const fetcher = useFetcher<typeof profileAction>();
	const leaveFetcher = useFetcher<typeof profileAction>();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [leaveState, leaveDispatch] = useReducer(
		destructiveConfirmReducer,
		initialDestructiveConfirmState,
	);
	const isPending = fetcher.state !== 'idle';

	const profile =
		fetcher.data?.ok && 'settings' in fetcher.data && fetcher.data.settings
			? fetcher.data.settings.profile
			: settings.profile;

	const profileUpdate: ProfileUpdate = {
		avatarDataUrl: profile.avatarDataUrl,
		displayName: profile.displayName,
		title: profile.title,
		username: profile.username,
	};

	useEffect(() => {
		if (leaveFetcher.state !== 'idle' || !leaveFetcher.data) return;
		if (leaveFetcher.data.ok && 'left' in leaveFetcher.data && leaveFetcher.data.left) {
			leaveDispatch({ type: 'succeed' });
			return;
		}
		if (!leaveFetcher.data.ok) {
			leaveDispatch({
				error: leaveFetcher.data.formError ?? 'Could not leave workspace',
				type: 'fail',
			});
		}
	}, [leaveFetcher.data, leaveFetcher.state]);

	function saveProfile(patch: Partial<ProfileUpdate>) {
		void fetcher.submit(
			{ ...profileUpdate, ...patch },
			{ encType: 'application/json', method: 'post' },
		);
	}

	function readAvatar(file: File) {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === 'string') {
				saveProfile({ avatarDataUrl: reader.result });
			}
		};
		reader.readAsDataURL(file);
	}

	function startLeave() {
		leaveDispatch({ type: 'confirm' });
		void leaveFetcher.submit({ intent: 'leave' }, { encType: 'application/json', method: 'post' });
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
			<SettingsSection>
				<SettingsRow label="Profile picture">
					<input
						accept="image/*"
						aria-label="Profile photo"
						hidden
						onChange={(event) => {
							const file = event.target.files?.[0];
							if (file) readAvatar(file);
							event.target.value = '';
						}}
						ref={fileInputRef}
						type="file"
					/>
					<MenuTrigger>
						<RacButton aria-label="Profile picture" className={styles.avatarButton}>
							{profile.avatarDataUrl ? (
								<img alt="" className={styles.avatar} src={profile.avatarDataUrl} />
							) : (
								<span aria-hidden="true" className={styles.avatar} />
							)}
						</RacButton>
						<Popover className={styles.menuPopover} placement="bottom end">
							<Menu
								aria-label="Profile picture"
								className={styles.menu}
								onAction={(key) => {
									if (key === 'change') {
										fileInputRef.current?.click();
										return;
									}
									if (key === 'remove') {
										saveProfile({ avatarDataUrl: null });
									}
								}}
							>
								<MenuItem className={styles.menuItem} id="change" textValue="Change avatar">
									<Icon name="edit" size="small" />
									Change avatar
								</MenuItem>
								<MenuItem
									className={styles.menuItem}
									id="remove"
									isDisabled={!profile.avatarDataUrl}
									textValue="Remove avatar"
								>
									<Icon name="close" size="small" />
									Remove avatar
								</MenuItem>
							</Menu>
						</Popover>
					</MenuTrigger>
				</SettingsRow>
				<SettingsRow label="Email">
					<Text color="secondary">{profile.email}</Text>
				</SettingsRow>
				<SettingsRow label="Full name">
					<ProfileFieldDialog
						label="Full name"
						onSave={(displayName) => saveProfile({ displayName })}
						validate={(value) => validateProfileField('displayName', value)}
						value={profile.displayName}
					/>
				</SettingsRow>
				<SettingsRow hint="Your job title or role" label="Title">
					<ProfileFieldDialog
						hint="Your job title or role"
						label="Title"
						onSave={(title) => saveProfile({ title })}
						placeholder="Software engineer"
						validate={(value) => validateProfileField('title', value)}
						value={profile.title}
					/>
				</SettingsRow>
				<SettingsRow hint="One word, like a nickname or first name" label="Username">
					<ProfileFieldDialog
						hint="One word, like a nickname or first name"
						label="Username"
						onSave={(username) => saveProfile({ username })}
						placeholder="username"
						validate={(value) => validateProfileField('username', value)}
						value={profile.username}
					/>
				</SettingsRow>
			</SettingsSection>
			{isPending ? <SettingsStatus>Saving…</SettingsStatus> : null}
			{fetcher.data?.ok && 'settings' in fetcher.data ? (
				<SettingsStatus tone="success">Profile saved.</SettingsStatus>
			) : null}
			{actionError ? (
				<SettingsStatus role="alert" tone="danger">
					{String(actionError)}
				</SettingsStatus>
			) : null}

			<DestructiveConfirmSection
				confirmButtonLabel="Yes, leave"
				confirmHint="Your profile and preferences will be wiped from this browser."
				confirmLabel="Confirm leave"
				dispatch={leaveDispatch}
				failedLabel="Could not leave"
				idleButtonLabel="Leave workspace"
				idleLabel="Remove yourself from workspace"
				onConfirm={startLeave}
				pendingMessage="Leaving workspace…"
				state={leaveState}
				successMessage="Left workspace on this device. Reload to start fresh."
				title="Workspace access"
			/>
		</SettingsPage>
	);
}

function validateProfileField(
	field: 'displayName' | 'title' | 'username',
	value: string,
): string | undefined {
	const result = profileUpdateSchema.shape[field].safeParse(value);
	if (result.success) return undefined;
	return result.error.issues[0]?.message;
}
