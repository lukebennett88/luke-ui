import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Icon } from '@luke-ui/react/icon';
import { Text } from '@luke-ui/react/text';
import { rootClassName } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button as RacButton } from 'react-aria-components/Button';
import { Menu, MenuItem, MenuTrigger } from 'react-aria-components/Menu';
import { Popover } from 'react-aria-components/Popover';
import type { Settings } from '../api/schemas.js';
import { profileSchema } from '../api/schemas.js';
import { settingsApi } from '../api/settings-api.js';
import { isSettingsMutationPending } from '../api/settings-mutation.js';
import { settingsQueryKey, updateSettingsCache } from '../api/settings-query.js';
import * as styles from '../styles/settings.css.js';
import { avatarUploadReducer, initialAvatarUploadState } from '../workflows/avatar-upload.js';
import { SettingsRow, SettingsSection, SettingsStatus } from './settings-section.js';

const SUPPORTED_AVATAR_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_AVATAR_BYTES = 1024 * 1024;
const NAME_PARTS_PATTERN = /\s+/;
const AVATAR_MUTATION_KEY = [...settingsQueryKey, 'avatar'] as const;

export function ProfileAvatarSection({
	children,
	profile,
}: {
	children: ReactNode;
	profile: Settings['profile'];
}) {
	const queryClient = useQueryClient();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [avatar, dispatch] = useReducer(avatarUploadReducer, initialAvatarUploadState);
	const [status, setStatus] = useState<string>();
	const {
		error: avatarMutationError,
		isPending: isAvatarSaving,
		mutateAsync: mutateAvatar,
		reset: resetAvatarMutation,
		variables: avatarMutationVariables,
	} = useMutation({
		mutationKey: AVATAR_MUTATION_KEY,
		mutationFn: (avatarDataUrl: string | null) => settingsApi.updateProfile({ avatarDataUrl }),
		onSuccess: (settings) => updateSettingsCache(queryClient, settings),
	});
	const isAvatarPending = avatar.status === 'reading' || isAvatarSaving;
	const avatarError: string | undefined = (() => {
		if (avatar.status === 'readFailed') return avatar.error;
		if (avatarMutationError instanceof Error) return avatarMutationError.message;
		return;
	})();
	const saveAvatar = useCallback(
		async (dataUrl: string | null) => {
			if (isSettingsMutationPending(queryClient, isAvatarSaving, AVATAR_MUTATION_KEY)) return;
			dispatch({ type: 'reset' });
			setStatus(undefined);
			resetAvatarMutation();
			try {
				await mutateAvatar(dataUrl);
				setStatus('Profile picture updated.');
			} catch {
				// The mutation owns retryable save errors and keeps its variables.
			}
		},
		[isAvatarSaving, mutateAvatar, queryClient, resetAvatarMutation],
	);

	useEffect(() => {
		if (avatar.status !== 'reading') return;
		let isCancelled = false;
		void readImage(avatar.file).then(
			(dataUrl) => {
				if (isCancelled) return;
				const result = profileSchema.shape.avatarDataUrl.safeParse(dataUrl);
				if (!result.success || !result.data) {
					dispatch({
						error: 'Choose a PNG, JPG or WebP image smaller than 1 MB.',
						type: 'readFailed',
					});
					return;
				}
				void saveAvatar(result.data);
			},
			() => {
				if (isCancelled) return;
				dispatch({ error: 'Could not read this image. Choose another file.', type: 'readFailed' });
			},
		);
		return () => {
			isCancelled = true;
		};
	}, [avatar, saveAvatar]);

	function readAvatar(file: File) {
		if (isAvatarPending) return;
		setStatus(undefined);
		resetAvatarMutation();
		if (!SUPPORTED_AVATAR_TYPES.has(file.type)) {
			dispatch({ error: 'Choose a PNG, JPG or WebP image.', type: 'rejected' });
			return;
		}
		if (file.size > MAX_AVATAR_BYTES) {
			dispatch({ error: 'Choose an image smaller than 1 MB.', type: 'rejected' });
			return;
		}
		dispatch({ file, type: 'selected' });
	}

	return (
		<>
			<SettingsSection>
				<SettingsRow hint="PNG, JPG or WebP, up to 1 MB" label="Profile picture">
					<input
						accept="image/png,image/jpeg,image/webp"
						aria-label="Upload profile picture"
						disabled={isAvatarPending}
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
						<RacButton
							aria-label="Profile picture"
							className={styles.avatarButton}
							data-pending={isAvatarPending || undefined}
							isPending={isAvatarPending}
						>
							{profile.avatarDataUrl ? (
								<img alt="" className={styles.avatar} src={profile.avatarDataUrl} />
							) : (
								<Text aria-hidden="true" className={styles.avatar} fontWeight="label">
									{getInitials(profile.displayName)}
								</Text>
							)}
							<span aria-hidden="true" className={styles.avatarOverlay}>
								<Icon name="edit" size="xsmall" />
							</span>
						</RacButton>
						<Popover className={cx(rootClassName, styles.menuPopover)} placement="bottom end">
							<Menu
								aria-label="Profile picture"
								className={styles.menu}
								onAction={(key) => {
									if (isAvatarPending) return;
									if (key === 'change') {
										fileInputRef.current?.click();
										return;
									}
									if (key === 'remove') void saveAvatar(null);
								}}
							>
								<MenuItem className={styles.menuItem} id="change" textValue="Change picture">
									<Icon name="edit" size="small" />
									<Text>Change picture</Text>
								</MenuItem>
								<MenuItem
									className={styles.menuItem}
									id="remove"
									isDisabled={!profile.avatarDataUrl}
									textValue="Remove picture"
								>
									<Icon name="close" size="small" />
									<Text>Remove picture</Text>
								</MenuItem>
							</Menu>
						</Popover>
					</MenuTrigger>
				</SettingsRow>
				{children}
			</SettingsSection>
			{avatarError ? (
				<Cluster alignItems="center" gap="sp8">
					<SettingsStatus role="alert" tone="danger">
						{avatarError}
					</SettingsStatus>
					{avatarMutationError && avatarMutationVariables !== undefined ? (
						<Button
							onPress={() => void saveAvatar(avatarMutationVariables)}
							size="small"
							type="button"
						>
							Try again
						</Button>
					) : null}
				</Cluster>
			) : null}
			<SettingsStatus tone={isAvatarPending ? undefined : 'success'}>
				{isAvatarPending ? 'Updating profile picture…' : status}
			</SettingsStatus>
		</>
	);
}

function getInitials(name: string): string {
	const parts = name.trim().split(NAME_PARTS_PATTERN);
	const first = parts[0]?.[0] ?? '';
	const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
	return `${first}${last}`.toUpperCase();
}

async function readImage(file: File): Promise<string> {
	const dataUrl = await new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result !== 'string') {
				reject(new Error('Could not read image'));
				return;
			}
			resolve(reader.result);
		};
		reader.onerror = () => reject(new Error('Could not read image'));
		reader.onabort = () => reject(new Error('Image read cancelled'));
		reader.readAsDataURL(file);
	});
	await new Promise<void>((resolve, reject) => {
		const image = new Image();
		image.onload = () => {
			if (image.naturalWidth === 0 || image.naturalHeight === 0) {
				reject(new Error('Invalid image'));
				return;
			}
			resolve();
		};
		image.onerror = () => reject(new Error('Invalid image'));
		image.src = dataUrl;
	});
	return dataUrl;
}
