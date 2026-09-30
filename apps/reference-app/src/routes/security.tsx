import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Track } from '@luke-ui/react/track';
import { useEffect, useReducer } from 'react';
import type { ActionFunctionArgs } from 'react-router';
import { useFetcher, useOutletContext } from 'react-router';
import { toActionError } from '../api/action-error.js';
import type { Session } from '../api/schemas.js';
import { securityActionSchema } from '../api/schemas.js';
import { settingsApi } from '../api/settings-api.js';
import { DestructiveConfirmSection } from '../components/destructive-confirm-section.js';
import {
	SettingsEmptyState,
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

export async function securityAction({ request }: ActionFunctionArgs) {
	const body = securityActionSchema.parse(await request.json());

	switch (body.intent) {
		case 'logout': {
			try {
				await settingsApi.clearLocalSettings();
				return { loggedOut: true as const, ok: true as const };
			} catch (error) {
				return toActionError(error, 'Log out failed');
			}
		}
		case 'revokeOthers': {
			try {
				const settings = await settingsApi.revokeOtherSessions();
				return { ok: true as const, settings };
			} catch (error) {
				return toActionError(error, 'Could not revoke sessions');
			}
		}
		case 'revoke': {
			try {
				const settings = await settingsApi.revokeSession(body.sessionId);
				return { ok: true as const, settings };
			} catch (error) {
				return toActionError(error, 'Could not revoke session');
			}
		}
		case 'delete': {
			try {
				await settingsApi.clearLocalSettings({
					allowServerFailure: true,
					serverFailureMessage: 'Account deletion failed. Try again.',
				});
				return { deleted: true as const, ok: true as const };
			} catch (error) {
				return toActionError(error, 'Deletion failed');
			}
		}
		default: {
			const _exhaustive: never = body;
			return _exhaustive;
		}
	}
}

export function SecurityPage() {
	const { settings } = useOutletContext<SettingsOutletContext>();
	const fetcher = useFetcher<typeof securityAction>();
	const deleteFetcher = useFetcher<typeof securityAction>();
	const [state, dispatch] = useReducer(destructiveConfirmReducer, initialDestructiveConfirmState);
	const sessions =
		fetcher.data?.ok && 'settings' in fetcher.data && fetcher.data.settings
			? fetcher.data.settings.security.sessions
			: settings.security.sessions;
	const currentSessions = sessions.filter((session) => session.isCurrent);
	const otherSessions = sessions.filter((session) => !session.isCurrent);
	const loggedOut = Boolean(
		fetcher.data?.ok && 'loggedOut' in fetcher.data && fetcher.data.loggedOut,
	);

	useEffect(() => {
		if (deleteFetcher.state !== 'idle' || !deleteFetcher.data) return;
		if (deleteFetcher.data.ok && 'deleted' in deleteFetcher.data && deleteFetcher.data.deleted) {
			dispatch({ type: 'succeed' });
			return;
		}
		if (!deleteFetcher.data.ok) {
			dispatch({ error: deleteFetcher.data.formError ?? 'Deletion failed', type: 'fail' });
		}
	}, [deleteFetcher.data, deleteFetcher.state]);

	function startDelete() {
		dispatch({ type: 'confirm' });
		void deleteFetcher.submit(
			{ intent: 'delete' },
			{ encType: 'application/json', method: 'post' },
		);
	}

	return (
		<SettingsPage title="Security & access">
			<SettingsSection description="Devices logged into your account" title="Sessions">
				{loggedOut ? (
					<Box className={styles.settingsRow}>
						<SettingsStatus tone="success">
							Logged out on this device. Reload to start fresh.
						</SettingsStatus>
					</Box>
				) : (
					<>
						{currentSessions.map((session) => (
							<SessionRow
								key={session.id}
								onAction={() =>
									void fetcher.submit(
										{ intent: 'logout' },
										{ encType: 'application/json', method: 'post' },
									)
								}
								session={session}
							/>
						))}
						{otherSessions.length > 0 ? (
							<>
								<div className={styles.subsectionHeader}>
									<Heading level={3} shouldDisableTrim typography="label">
										{otherSessions.length === 1
											? '1 other session'
											: `${otherSessions.length} other sessions`}
									</Heading>
									<Button
										onPress={() =>
											void fetcher.submit(
												{ intent: 'revokeOthers' },
												{ encType: 'application/json', method: 'post' },
											)
										}
										size="small"
										tone="neutral"
									>
										Revoke all
									</Button>
								</div>
								{otherSessions.map((session) => (
									<SessionRow
										key={session.id}
										onAction={() =>
											void fetcher.submit(
												{ intent: 'revoke', sessionId: session.id },
												{ encType: 'application/json', method: 'post' },
											)
										}
										session={session}
									/>
								))}
							</>
						) : null}
					</>
				)}
			</SettingsSection>

			<SecurityPlaceholderSections />

			<DestructiveConfirmSection
				buttonSize="small"
				confirmButtonLabel="Yes, delete"
				confirmHint="Your profile and preferences will be wiped from this browser."
				confirmLabel="Confirm deletion"
				description="Permanently delete this account and its personal settings on this device."
				dispatch={dispatch}
				failedLabel="Deletion failed"
				idleButtonLabel="Delete account"
				idleHint="This removes locally stored settings. It cannot be undone."
				idleLabel="Delete account"
				onConfirm={startDelete}
				pendingMessage="Deleting account…"
				state={state}
				successMessage="Account deleted on this device. Reload to start fresh."
				title="Danger zone"
				tone="danger"
			/>
		</SettingsPage>
	);
}

function SecurityPlaceholderSections() {
	return (
		<>
			<SettingsSection
				description="Passkeys are a secure way to sign in to your Linear account"
				title="Passkeys"
			>
				<SettingsEmptyState
					action={
						<Button size="small" tone="neutral">
							New passkey
						</Button>
					}
					label="No passkeys registered"
				/>
			</SettingsSection>

			<SettingsSection
				description="Use Linear’s GraphQL API to build your own integrations"
				title="Personal API keys"
			>
				<SettingsEmptyState
					action={
						<Button size="small" tone="neutral">
							New API key
						</Button>
					}
					label="No API keys created"
				/>
			</SettingsSection>

			<SettingsSection
				description="Coding sessions use this key to sign your commits"
				title="Commit signing key"
			>
				<SettingsRow label="No signing key added">
					<Button size="small" tone="neutral">
						Add key
					</Button>
				</SettingsRow>
			</SettingsSection>

			<SettingsSection
				description="OAuth applications you’ve approved"
				title="Authorized applications"
			>
				<Box className={styles.settingsRow}>
					<Text color="secondary" typography="caption">
						No applications have been authorized to connect with your account.
					</Text>
				</Box>
			</SettingsSection>
		</>
	);
}

const MOBILE_SESSION_LABEL_PATTERN = /iphone|android|mobile/i;

function SessionRow({ onAction, session }: { onAction: () => void; session: Session }) {
	const iconName = MOBILE_SESSION_LABEL_PATTERN.test(session.label) ? 'mobilePhone' : 'monitor';

	return (
		<Track
			className={styles.settingsRow}
			gap="sp16"
			railAlignment="center"
			railEnd={
				<div className={styles.rowControl}>
					<Button onPress={onAction} size="small" tone="neutral">
						{session.isCurrent ? 'Log out' : 'Revoke'}
					</Button>
				</div>
			}
		>
			<Box alignItems="center" display="flex" gap="sp12">
				<span className={styles.sessionIcon}>
					<Icon name={iconName} size="small" />
				</span>
				<Stack gap="sp4">
					<Text fontWeight="label">{session.label}</Text>
					{session.isCurrent ? (
						<span className={styles.sessionMeta}>
							<span className={styles.currentDot} />
							<Text color="success" typography="caption">
								Current session
							</Text>
							<Text aria-hidden="true" color="secondary" typography="caption">
								·
							</Text>
							<Text color="secondary" typography="caption">
								{session.location}
							</Text>
						</span>
					) : (
						<Text color="secondary" typography="caption">
							{session.location}
							{session.lastSeen ? ` · ${session.lastSeen}` : null}
						</Text>
					)}
				</Stack>
			</Box>
		</Track>
	);
}
