import type { IconName } from '@luke-ui/react/icon';
import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { useState } from 'react';
import { NavLink } from 'react-router';
import * as styles from '../styles/settings.css.js';

export const SETTINGS_NAV = [
	{ icon: 'bookOpen', label: 'Preferences', to: '/settings/preferences' },
	{ icon: 'edit', label: 'Profile', to: '/settings/profile' },
	{ icon: 'exclamationTriangle', label: 'Security & access', to: '/settings/security' },
] as const satisfies Array<{ icon: IconName; label: string; to: string }>;

type SettingsNavItem = (typeof SETTINGS_NAV)[number];

function filterSettingsNavItems(query: string) {
	const normalized = query.trim().toLowerCase();
	return normalized
		? SETTINGS_NAV.filter((item) => item.label.toLowerCase().includes(normalized))
		: SETTINGS_NAV;
}

export function SettingsNavSearch({
	onChange,
	value,
}: {
	onChange: (value: string) => void;
	value: string;
}) {
	return (
		<TextInputField
			aria-label="Search settings"
			onChange={onChange}
			placeholder="Search…"
			prefix={<Icon name="search" size="small" />}
			size="small"
			type="search"
			value={value}
		/>
	);
}

type SettingsNavProps = { query: string; variant?: 'sidebar' } | { variant: 'menu' };

export function SettingsNav(props: SettingsNavProps) {
	const [menuQuery, setMenuQuery] = useState('');

	if (props.variant === 'menu') {
		return (
			<Stack gap="sp12">
				<SettingsNavSearch onChange={setMenuQuery} value={menuQuery} />
				<SettingsNavList items={filterSettingsNavItems(menuQuery)} variant="menu" />
			</Stack>
		);
	}

	return (
		<Stack gap="sp16">
			<SettingsNavList items={filterSettingsNavItems(props.query)} variant="sidebar" />
		</Stack>
	);
}

function SettingsNavList({
	items,
	variant,
}: {
	items: Array<SettingsNavItem>;
	variant: 'menu' | 'sidebar';
}) {
	const linkClass = variant === 'menu' ? styles.menuNavLink : styles.navLink;

	return (
		<Stack
			aria-label={variant === 'menu' ? 'Settings menu' : 'Settings'}
			elementType="nav"
			gap="sp4"
		>
			<Text color="secondary" fontWeight="label" typography="label">
				Personal
			</Text>
			{items.map((item) => (
				<SettingsNavLink className={linkClass} item={item} key={item.to} />
			))}
			{items.length === 0 ? (
				<Text color="secondary" role="status" typography="caption">
					No matching settings
				</Text>
			) : null}
		</Stack>
	);
}

function SettingsNavLink({ className, item }: { className: string; item: SettingsNavItem }) {
	return (
		<NavLink className={className} end to={item.to}>
			<Icon name={item.icon} size="xsmall" />
			{item.label}
		</NavLink>
	);
}
