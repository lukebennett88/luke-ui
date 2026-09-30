import { Box } from '@luke-ui/react/box';
import { Cluster } from '@luke-ui/react/cluster';
import { Heading } from '@luke-ui/react/heading';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Track } from '@luke-ui/react/track';
import type { ReactNode } from 'react';
import * as styles from '../styles/settings.css.js';

export function SettingsPage({ children, title }: { children: ReactNode; title: string }) {
	return (
		<Stack gap="sp24">
			<Heading level={1} shouldDisableTrim>
				{title}
			</Heading>
			{children}
		</Stack>
	);
}

export function SettingsSection({
	children,
	description,
	title,
	tone,
}: {
	children: ReactNode;
	description?: string;
	title?: string;
	tone?: 'danger';
}) {
	const panelClass = tone === 'danger' ? `${styles.panel} ${styles.dangerPanel}` : styles.panel;

	return (
		<Stack elementType="section" gap="sp8" marginBlockEnd="sp32">
			{title ? (
				<Heading
					color={tone === 'danger' ? 'danger' : undefined}
					level={2}
					shouldDisableTrim
					typography="label"
				>
					{title}
				</Heading>
			) : null}
			{description ? (
				<Text color="secondary" elementType="p" typography="caption">
					{description}
				</Text>
			) : null}
			<div className={panelClass}>{children}</div>
		</Stack>
	);
}

export function SettingsRow({
	children,
	hint,
	label,
}: {
	children: ReactNode;
	hint?: string;
	label: string;
}) {
	return (
		<Track
			className={styles.settingsRow}
			gap="sp16"
			railAlignment="center"
			railEnd={<div className={styles.rowControl}>{children}</div>}
		>
			<Stack gap="sp4">
				<Text fontWeight="label">{label}</Text>
				{hint ? (
					<Text color="secondary" typography="caption">
						{hint}
					</Text>
				) : null}
			</Stack>
		</Track>
	);
}

export function SettingsEmptyState({ action, label }: { action?: ReactNode; label: string }) {
	return (
		<Track
			className={styles.settingsRow}
			gap="sp16"
			railAlignment="center"
			railEnd={action ? <div className={styles.rowControl}>{action}</div> : undefined}
		>
			<Heading level={3} shouldDisableTrim typography="label">
				{label}
			</Heading>
		</Track>
	);
}

export function SettingsStatus({
	children,
	role = 'status',
	tone,
}: {
	children: ReactNode;
	role?: 'status' | 'alert';
	tone?: 'danger' | 'success';
}) {
	return (
		<Box marginBlockStart="sp12">
			<Text
				color={tone === 'danger' ? 'danger' : tone === 'success' ? 'success' : 'secondary'}
				elementType="p"
				role={role}
				typography="caption"
			>
				{children}
			</Text>
		</Box>
	);
}

export function SettingsRowActions({ children }: { children: ReactNode }) {
	return (
		<Cluster alignItems="center" gap="sp8">
			{children}
		</Cluster>
	);
}
