import { NavLink } from 'react-router';

export const SETTINGS_NAV = [
	{ label: 'Profile', to: '/settings/profile' },
	{ label: 'Preferences', to: '/settings/preferences' },
	{ label: 'Interface', to: '/settings/interface' },
	{ label: 'Account', to: '/settings/account' },
] as const;

export function SettingsNav({ className }: { className?: string }) {
	return (
		<nav aria-label="Settings" className={className}>
			{SETTINGS_NAV.map((item) => (
				<NavLink key={item.to} className="settings-nav-link" end to={item.to}>
					{item.label}
				</NavLink>
			))}
		</nav>
	);
}
