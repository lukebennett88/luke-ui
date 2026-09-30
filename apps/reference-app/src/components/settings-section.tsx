import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Stack } from '@luke-ui/react/stack';
import type { TextProps } from '@luke-ui/react/text';
import { Text } from '@luke-ui/react/text';
import type { ReactNode } from 'react';
import * as styles from '../styles/settings.css.js';

export function SettingsPage({ children, title }: { children: ReactNode; title: string }) {
	return (
		<Stack gap="sp24">
			<Heading level={1} shouldDisableTrim tabIndex={-1} typography="heading2">
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
}: {
	children: ReactNode;
	description?: string;
	title?: string;
}) {
	return (
		<Stack elementType="section" gap="sp24" marginBlockEnd="sp32">
			{title ? (
				<Heading level={2} shouldDisableTrim typography="lead">
					{title}
				</Heading>
			) : null}
			{description ? (
				<Text color="secondary" elementType="p" typography="caption">
					{description}
				</Text>
			) : null}
			<div className={styles.panel}>{children}</div>
		</Stack>
	);
}

export function SettingsRowShell({ children }: { children: ReactNode }) {
	return (
		<Box
			alignItems="center"
			className={styles.settingsRow}
			display="flex"
			gap="sp12"
			paddingBlock="sp12"
			paddingInline="sp16"
		>
			{children}
		</Box>
	);
}

export function SettingsRowControl({ children }: { children: ReactNode }) {
	return (
		<Box
			className={styles.rowControl}
			display="flex"
			flexShrink="0"
			justifyContent="flex-end"
			marginInlineStart="auto"
		>
			{children}
		</Box>
	);
}

export function SettingsRow({
	children,
	descriptionId,
	hint,
	label,
}: {
	children: ReactNode;
	descriptionId?: string;
	hint?: string;
	label: string;
}) {
	return (
		<SettingsRowShell>
			<Stack flexGrow="1" gap="sp4" minInlineSize="0">
				<Text typography="label">{label}</Text>
				{hint ? (
					<Text color="secondary" fontWeight="body" id={descriptionId} typography="label">
						{hint}
					</Text>
				) : null}
			</Stack>
			<SettingsRowControl>{children}</SettingsRowControl>
		</SettingsRowShell>
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
	if (children == null || children === false || children === '') return null;
	const textColor: TextProps['color'] = (() => {
		if (tone === 'danger') return 'danger';
		if (tone === 'success') return 'success';
		return 'secondary';
	})();

	return (
		<Box marginBlockStart="sp12">
			<Text color={textColor} elementType="p" role={role} typography="caption">
				{children}
			</Text>
		</Box>
	);
}
