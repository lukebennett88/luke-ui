import '../generated/theme.css';
import '../styles/global.css';
import '@luke-ui/react/stylesheet.css';
import { Box } from '@luke-ui/react/box';
import { Container } from '@luke-ui/react/container';
import { Icon } from '@luke-ui/react/icon';
import { Provider } from '@luke-ui/react/provider';
import spritesheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { rootClassName } from '@luke-ui/react/theme';
import { Track } from '@luke-ui/react/track';
import { Button as RacButton } from 'react-aria-components/Button';
import { Link, Outlet, useLocation, useRouteLoaderData } from 'react-router';
import type { Settings } from '../api/schemas.js';
import { SETTINGS_NAV, SettingsNav } from '../components/settings-nav.js';
import * as styles from '../styles/settings.css.js';

export type SettingsOutletContext = {
	settings: Settings;
};

export function SettingsLayout() {
	const location = useLocation();
	const data = useRouteLoaderData('settings');
	const current = SETTINGS_NAV.find((item) => item.to === location.pathname);
	const isMenu = location.pathname === '/settings/menu';

	return (
		<Provider spritesheetHref={spritesheetHref}>
			<title>{current ? `${current.label} · Settings` : 'Settings'}</title>
			<div className={`${rootClassName} ${styles.shell}`}>
				<a className={styles.skipLink} href="#settings-main">
					Skip to content
				</a>
				{/* Box owns display — Stack forces flex and would defeat VE hide-on-narrow. */}
				<Box
					aria-label="Settings"
					className={styles.sidebar}
					display={{ bp768: 'flex', initial: 'none' }}
					elementType="aside"
					flexDirection="column"
					gap="sp12"
				>
					<BackToAppButton />
					<div className={styles.sidebarScroll}>
						<SettingsNav />
					</div>
				</Box>
				<Box className={styles.main} elementType="main" id="settings-main">
					<div className={styles.mainScroll}>
						<Container maxInlineSize="ct672">
							{isMenu ? null : (
								<Box alignItems="center" className={styles.mobileHeader} gap="sp4">
									<Link className={styles.mobileHeaderLink} to="/settings/menu">
										<Icon name="chevronLeft" size="small" />
										Settings
									</Link>
								</Box>
							)}
							<Outlet context={{ settings: data.settings } satisfies SettingsOutletContext} />
						</Container>
					</div>
				</Box>
			</div>
		</Provider>
	);
}

export function SettingsMenuPage() {
	return (
		<Stack gap="sp16">
			<BackToAppButton />
			<SettingsNav variant="menu" />
		</Stack>
	);
}

function BackToAppButton() {
	return (
		<RacButton className={styles.backLink}>
			<Track
				elementType="span"
				gap="sp4"
				railAlignment="firstLine"
				railStart={<Icon name="chevronLeft" size="small" />}
			>
				<Text typography="caption">Back to app</Text>
			</Track>
		</RacButton>
	);
}
