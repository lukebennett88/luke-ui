import '../generated/theme.css';
import '../styles/global.css';
import '@luke-ui/react/stylesheet.css';
import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Provider } from '@luke-ui/react/provider';
import spritesheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { rootClassName } from '@luke-ui/react/theme';
import { Link, Outlet, useLocation, useRouteLoaderData } from 'react-router';
import type { Settings } from '../api/schemas.js';
import { SettingsNav, SETTINGS_NAV } from '../components/settings-nav.js';
import { SettingsPage } from '../components/settings-section.js';
import * as styles from '../styles/settings.css.js';

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
			<div className={`${rootClassName} ${styles.shell}`}>
				<Stack className={styles.sidebar} elementType="aside" gap="sp4">
					<Text className={styles.sidebarTitle} fontWeight="label" typography="caption">
						Settings
					</Text>
					<SettingsNav />
				</Stack>
				<Box className={styles.main} elementType="main">
					<div className={styles.content}>
						{isMenu ? null : (
							<Cluster className={styles.mobileHeader} gap="sp8">
								<Link className={styles.mobileHeaderLink} to="/settings/menu">
									← Settings
								</Link>
								<Text aria-hidden="true" color="secondary">
									/
								</Text>
								<Text color="secondary">{current?.label ?? 'Settings'}</Text>
							</Cluster>
						)}
						<Outlet context={{ settings: data.settings } satisfies SettingsOutletContext} />
					</div>
				</Box>
			</div>
		</Provider>
	);
}

export function SettingsMenuPage() {
	return (
		<SettingsPage title="Settings">
			<div className={styles.panel}>
				<SettingsNav variant="menu" />
			</div>
		</SettingsPage>
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
