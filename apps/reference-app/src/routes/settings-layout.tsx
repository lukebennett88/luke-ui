import '../app.css';
import { Button } from '@luke-ui/react/button';
import { Provider } from '@luke-ui/react/provider';
import spritesheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { rootClassName } from '@luke-ui/react/theme';
import { Link, Outlet, useLocation, useRouteLoaderData } from 'react-router';
import type { Settings } from '../api/schemas.js';
import { SettingsNav, SETTINGS_NAV } from '../components/settings-nav.js';

export type SettingsOutletContext = {
	settings: Settings;
};

type SettingsLoaderData = {
	settings: Settings;
};

export function SettingsLayout() {
	const location = useLocation();
	const data = useRouteLoaderData('settings') as SettingsLoaderData;
	const current = SETTINGS_NAV.find((item) => item.to === location.pathname);
	const isMenu = location.pathname === '/settings/menu';

	return (
		<Provider spritesheetHref={spritesheetHref}>
			<div className={`${rootClassName} settings-shell`}>
				<aside className="settings-sidebar">
					<div className="settings-sidebar-title">Settings</div>
					<SettingsNav />
				</aside>
				<main className="settings-main">
					<div className="settings-content">
						{isMenu ? null : (
							<div className="settings-mobile-header">
								<Link to="/settings/menu">← Settings</Link>
								<span aria-hidden="true">/</span>
								<span>{current?.label ?? 'Settings'}</span>
							</div>
						)}
						<Outlet context={{ settings: data.settings } satisfies SettingsOutletContext} />
					</div>
				</main>
			</div>
		</Provider>
	);
}

export function SettingsMenuPage() {
	return (
		<>
			<h1 className="settings-page-title">Settings</h1>
			<div className="settings-panel">
				<SettingsNav className="settings-menu-nav" />
			</div>
		</>
	);
}

export function SaveButton({
	isPending,
	isDirty,
	label = 'Save',
}: {
	isDirty: boolean;
	isPending: boolean;
	label?: string;
}) {
	return (
		<Button isDisabled={!isDirty || isPending} prominence="high" type="submit">
			{isPending ? 'Saving…' : label}
		</Button>
	);
}
