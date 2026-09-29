import { Stack } from '@luke-ui/react/stack';
import { NavLink } from 'react-router';
import * as styles from '../styles/settings.css.js';

export const SETTINGS_NAV = [
	{ label: 'Profile', to: '/settings/profile' },
	{ label: 'Preferences', to: '/settings/preferences' },
	{ label: 'Interface', to: '/settings/interface' },
	{ label: 'Account', to: '/settings/account' },
] as const;

export function SettingsNav({ variant = 'sidebar' }: { variant?: 'menu' | 'sidebar' }) {
	const linkClass = variant === 'menu' ? styles.menuNavLink : styles.navLink;

	return (
		<Stack aria-label="Settings" elementType="nav" gap={variant === 'menu' ? '0' : 'sp4'}>
			{SETTINGS_NAV.map((item) => (
				<NavLink className={linkClass} end key={item.to} to={item.to}>
					{item.label}
				</NavLink>
			))}
		</Stack>
	);
}
