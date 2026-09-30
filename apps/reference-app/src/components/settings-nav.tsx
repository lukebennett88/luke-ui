import type { IconName } from '@luke-ui/react/icon';
import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextField } from '@luke-ui/react/text-field';
import { useState } from 'react';
import { NavLink } from 'react-router';
import * as styles from '../styles/settings.css.js';

export const SETTINGS_NAV = [
	{ icon: 'bookOpen', label: 'Preferences', to: '/settings/preferences' },
	{ icon: 'edit', label: 'Profile', to: '/settings/profile' },
	{ icon: 'exclamationTriangle', label: 'Security & access', to: '/settings/security' },
] as const satisfies Array<{ icon: IconName; label: string; to: string }>;

type SettingsNavItem = (typeof SETTINGS_NAV)[number];

export function SettingsNav({ variant = 'sidebar' }: { variant?: 'menu' | 'sidebar' }) {
	const [query, setQuery] = useState('');
	const linkClass = variant === 'menu' ? styles.menuNavLink : styles.navLink;
	const normalized = query.trim().toLowerCase();
	const items = normalized
		? SETTINGS_NAV.filter((item) => item.label.toLowerCase().includes(normalized))
		: SETTINGS_NAV;

	return (
		<Stack gap={variant === 'menu' ? 'sp12' : 'sp16'}>
			<TextField
				aria-label="Search settings"
				onChange={setQuery}
				placeholder="Search…"
				prefix={<Icon name="search" size="small" />}
				size="small"
				type="search"
				value={query}
			/>
			<Stack
				aria-label={variant === 'menu' ? 'Settings menu' : 'Settings'}
				elementType="nav"
				gap="sp4"
			>
				<Text className={styles.sidebarTitle} fontWeight="label" typography="caption">
					Personal
				</Text>
				{items.map((item) => (
					<SettingsNavLink className={linkClass} item={item} key={item.to} />
				))}
				{items.length === 0 ? (
					<Text color="secondary" typography="caption">
						No matching settings
					</Text>
				) : null}
			</Stack>
		</Stack>
	);
}

function SettingsNavLink({ className, item }: { className: string; item: SettingsNavItem }) {
	return (
		<NavLink className={className} end to={item.to}>
			<Icon name={item.icon} size="small" />
			{item.label}
		</NavLink>
	);
}
