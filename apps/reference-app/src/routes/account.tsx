import { Button } from '@luke-ui/react/button';
import { useEffect, useReducer } from 'react';
import { useFetcher, useOutletContext } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';
import { settingsApi } from '../api/settings-api.js';
import { SettingsRow, SettingsSection } from '../components/settings-section.js';
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
		<>
			<h1 className="settings-page-title">Account</h1>
			<SettingsSection title="Details">
				<SettingsRow label="Workspace">
					<span className="settings-row-hint">{settings.account.workspace}</span>
				</SettingsRow>
				<SettingsRow label="Plan">
					<span className="settings-row-hint">{settings.account.plan}</span>
				</SettingsRow>
				<SettingsRow label="Member since">
					<span className="settings-row-hint">{settings.account.createdAt}</span>
				</SettingsRow>
			</SettingsSection>

			<section className="settings-section">
				<h2 className="settings-section-title">Danger zone</h2>
				<p className="settings-section-description">
					Permanently delete this account and its personal settings on this device.
				</p>
				<div className="settings-panel settings-danger-panel">
					{state.status === 'idle' ? (
						<div className="settings-row">
							<div className="settings-row-copy">
								<span className="settings-row-label">Delete account</span>
								<span className="settings-row-hint">
									This removes locally stored settings. It cannot be undone.
								</span>
							</div>
							<div className="settings-row-control">
								<Button onPress={() => dispatch({ type: 'open' })} tone="critical" type="button">
									Delete account
								</Button>
							</div>
						</div>
					) : null}

					{state.status === 'confirming' ? (
						<div className="settings-row">
							<div className="settings-row-copy">
								<span className="settings-row-label">Confirm deletion</span>
								<span className="settings-row-hint">
									Your profile and preferences will be wiped from this browser.
								</span>
							</div>
							<div className="settings-row-control settings-avatar-actions">
								<Button onPress={() => dispatch({ type: 'cancel' })} prominence="low" type="button">
									Cancel
								</Button>
								<Button onPress={startDelete} tone="critical" type="button">
									Yes, delete
								</Button>
							</div>
						</div>
					) : null}

					{state.status === 'deleting' ? (
						<div className="settings-row">
							<p className="settings-status" role="status">
								Deleting account…
							</p>
						</div>
					) : null}

					{state.status === 'failed' ? (
						<div className="settings-row">
							<div className="settings-row-copy">
								<span className="settings-row-label">Deletion failed</span>
								<span className="settings-row-hint">{state.error}</span>
							</div>
							<div className="settings-row-control settings-avatar-actions">
								<Button onPress={() => dispatch({ type: 'cancel' })} prominence="low" type="button">
									Back
								</Button>
								<Button onPress={startDelete} tone="critical" type="button">
									Try again
								</Button>
							</div>
						</div>
					) : null}

					{state.status === 'completed' ? (
						<div className="settings-row">
							<p className="settings-status" data-tone="success" role="status">
								Account deleted on this device. Reload to start fresh.
							</p>
						</div>
					) : null}
				</div>
			</section>
		</>
	);
}
