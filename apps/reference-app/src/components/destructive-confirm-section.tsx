import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import type { Dispatch } from 'react';
import * as styles from '../styles/settings.css.js';
import type {
	DestructiveConfirmAction,
	DestructiveConfirmState,
} from '../workflows/destructive-confirm.js';
import {
	SettingsRow,
	SettingsRowActions,
	SettingsSection,
	SettingsStatus,
} from './settings-section.js';

export function DestructiveConfirmSection({
	buttonSize,
	confirmButtonLabel,
	confirmHint,
	confirmLabel,
	description,
	dispatch,
	failedLabel = 'Something went wrong',
	idleButtonLabel,
	idleHint,
	idleLabel,
	onConfirm,
	pendingMessage,
	state,
	successMessage,
	title,
	tone,
}: {
	buttonSize?: 'small';
	confirmButtonLabel: string;
	confirmHint?: string;
	confirmLabel: string;
	description?: string;
	dispatch: Dispatch<DestructiveConfirmAction>;
	failedLabel?: string;
	idleButtonLabel: string;
	idleHint?: string;
	idleLabel: string;
	onConfirm: () => void;
	pendingMessage: string;
	state: DestructiveConfirmState;
	successMessage: string;
	title: string;
	tone?: 'danger';
}) {
	return (
		<SettingsSection description={description} title={title} tone={tone}>
			{state.status === 'idle' ? (
				<SettingsRow hint={idleHint} label={idleLabel}>
					<Button
						onPress={() => dispatch({ type: 'open' })}
						prominence={tone === 'danger' ? undefined : 'standard'}
						size={buttonSize}
						tone="critical"
						type="button"
					>
						{idleButtonLabel}
					</Button>
				</SettingsRow>
			) : null}

			{state.status === 'confirming' ? (
				<SettingsRow hint={confirmHint} label={confirmLabel}>
					<SettingsRowActions>
						<Button
							onPress={() => dispatch({ type: 'cancel' })}
							prominence="low"
							size={buttonSize}
							type="button"
						>
							Cancel
						</Button>
						<Button
							onPress={onConfirm}
							prominence="high"
							size={buttonSize}
							tone="critical"
							type="button"
						>
							{confirmButtonLabel}
						</Button>
					</SettingsRowActions>
				</SettingsRow>
			) : null}

			{state.status === 'pending' ? (
				<Box className={styles.settingsRow}>
					<SettingsStatus>{pendingMessage}</SettingsStatus>
				</Box>
			) : null}

			{state.status === 'failed' ? (
				<SettingsRow hint={state.error ?? undefined} label={failedLabel}>
					<SettingsRowActions>
						<Button
							onPress={() => dispatch({ type: 'cancel' })}
							prominence="low"
							size={buttonSize}
							type="button"
						>
							Back
						</Button>
						<Button
							onPress={onConfirm}
							prominence="high"
							size={buttonSize}
							tone="critical"
							type="button"
						>
							Try again
						</Button>
					</SettingsRowActions>
				</SettingsRow>
			) : null}

			{state.status === 'completed' ? (
				<Box className={styles.settingsRow}>
					<SettingsStatus tone="success">{successMessage}</SettingsStatus>
				</Box>
			) : null}
		</SettingsSection>
	);
}
