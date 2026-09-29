import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Heading } from '@luke-ui/react/heading';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { useEffect, useReducer } from 'react';
import { useFetcher, useOutletContext } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';
import { settingsApi } from '../api/settings-api.js';
import {
	SettingsAvatarActions,
	SettingsPage,
	SettingsRow,
	SettingsSection,
	SettingsStatus,
} from '../components/settings-section.js';
import * as styles from '../styles/settings.css.js';
import { deleteAccountReducer, initialDeleteAccountState } from '../workflows/delete-account.js';
import type { SettingsOutletContext } from './settings-layout.js';

export async function accountAction({ request }: ActionFunctionArgs) {
	const body = (await request.json()) as { intent?: string };
	if (body.intent !== 'delete') {
		return { ok: false as const, formError: 'Unknown action' };
	}
	try {
		await settingsApi.deleteAccount();
		return { ok: true as const, deleted: true as const };
	} catch (error) {
		return {
			ok: false as const,
			formError: error instanceof Error ? error.message : 'Deletion failed',
		};
	}
}

export function AccountPage() {
	const { settings } = useOutletContext<SettingsOutletContext>();
	const fetcher = useFetcher<typeof accountAction>();
	const [state, dispatch] = useReducer(deleteAccountReducer, initialDeleteAccountState);

	useEffect(() => {
		if (fetcher.state !== 'idle' || !fetcher.data) return;
		if (fetcher.data.ok && fetcher.data.deleted) {
			dispatch({ type: 'succeed' });
			return;
		}
		if (!fetcher.data.ok) {
			dispatch({ type: 'fail', error: fetcher.data.formError ?? 'Deletion failed' });
		}
	}, [fetcher.data, fetcher.state]);

	function startDelete() {
		dispatch({ type: 'confirm' });
		void fetcher.submit({ intent: 'delete' }, { encType: 'application/json', method: 'post' });
	}

	return (
		<SettingsPage title="Account">
			<SettingsSection title="Details">
				<SettingsRow label="Workspace">
					<Text>{settings.account.workspace}</Text>
				</SettingsRow>
				<SettingsRow label="Plan">
					<Text>{settings.account.plan}</Text>
				</SettingsRow>
				<SettingsRow label="Member since">
					<Text>{settings.account.createdAt}</Text>
				</SettingsRow>
			</SettingsSection>

			<Stack elementType="section" gap="sp8" marginBlockEnd="sp32">
				<Heading color="danger" level={2} shouldDisableTrim typography="label">
					Danger zone
				</Heading>
				<Text color="secondary" elementType="p" typography="caption">
					Permanently delete this account and its personal settings on this device.
				</Text>
				<div className={`${styles.panel} ${styles.dangerPanel}`}>
					{state.status === 'idle' ? (
						<SettingsRow
							hint="This removes locally stored settings. It cannot be undone."
							label="Delete account"
						>
							<Button
								onPress={() => dispatch({ type: 'open' })}
								prominence="high"
								tone="critical"
								type="button"
							>
								Delete account
							</Button>
						</SettingsRow>
					) : null}

					{state.status === 'confirming' ? (
						<SettingsRow
							hint="Your profile and preferences will be wiped from this browser."
							label="Confirm deletion"
						>
							<SettingsAvatarActions>
								<Button onPress={() => dispatch({ type: 'cancel' })} prominence="low" type="button">
									Cancel
								</Button>
								<Button onPress={startDelete} tone="critical" type="button">
									Yes, delete
								</Button>
							</SettingsAvatarActions>
						</SettingsRow>
					) : null}

					{state.status === 'deleting' ? (
						<Box className={styles.settingsRow}>
							<SettingsStatus>Deleting account…</SettingsStatus>
						</Box>
					) : null}

					{state.status === 'failed' ? (
						<SettingsRow hint={state.error ?? undefined} label="Deletion failed">
							<SettingsAvatarActions>
								<Button onPress={() => dispatch({ type: 'cancel' })} prominence="low" type="button">
									Back
								</Button>
								<Button onPress={startDelete} tone="critical" type="button">
									Try again
								</Button>
							</SettingsAvatarActions>
						</SettingsRow>
					) : null}

					{state.status === 'completed' ? (
						<Box className={styles.settingsRow}>
							<SettingsStatus tone="success">
								Account deleted on this device. Reload to start fresh.
							</SettingsStatus>
						</Box>
					) : null}
				</div>
			</Stack>
		</SettingsPage>
	);
}
