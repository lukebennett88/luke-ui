import { Box } from '@luke-ui/react/box';
import { Container } from '@luke-ui/react/container';
import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { Link } from '@luke-ui/react/link';
import { ScrollFade } from '@luke-ui/react/scroll-fade';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Outlet, Link as RouterLink, useLocation } from 'react-router';
import { usePreferencesMutation } from './preferences/preferences-mutation.js';
import type { Settings } from './schemas.js';
import { SETTINGS_NAV, SettingsNav, SettingsNavSearch } from './settings-nav.js';
import type { SettingsOutletContext } from './settings-outlet-context.js';
import { settingsQueryOptions } from './settings-query.js';
import * as styles from './settings.css.js';

const MAIN_ID = 'settings-main';

export function SettingsLayout() {
	const { pathname } = useLocation();
	const settings = useQuery(settingsQueryOptions).data!;
	const preferencesContext = usePreferencesMutation(settings.preferences);

	const current = SETTINGS_NAV.find((item) => item.to === pathname);
	const isMenu = pathname === '/settings/menu';
	const mainRef = useRef<HTMLDivElement>(null);
	const previousPathname = useRef(pathname);
	const [sidebarNavQuery, setSidebarNavQuery] = useState('');

	useEffect(() => {
		if (previousPathname.current === pathname) return;
		previousPathname.current = pathname;
		mainRef.current?.scrollTo({ top: 0 });
		mainRef.current?.closest('main')?.querySelector('h1')?.focus({ preventScroll: true });
	}, [pathname]);

	return (
		<>
			<title>{current ? `${current.label} · Settings` : 'Settings'}</title>
			<Box
				backgroundColor="surface.subdued"
				blockSize="100%"
				className={styles.shell}
				display="flex"
				minBlockSize="100%"
				overflow="hidden"
			>
				<a className={styles.skipLink} href={`#${MAIN_ID}`}>
					Skip to content
				</a>
				{/* Box owns display — Stack forces flex and would defeat VE hide-on-narrow. */}
				<Box
					aria-label="Settings navigation"
					display={isMenu ? 'none' : { bp768: 'flex', initial: 'none' }}
					elementType="aside"
					flexDirection="column"
					flexShrink="0"
					gap="space.24"
					minBlockSize="0"
					overflow="hidden"
					paddingBlock="space.16"
					style={{ inlineSize: '244px' }}
				>
					<Stack className={styles.sidebarHeader} flexShrink="0" gap="space.12">
						<Box>
							<Link
								appearance="button"
								href="/"
								prominence="low"
								size="small"
								startContent={<Icon name="chevronLeft" />}
							>
								Back to app
							</Link>
						</Box>
						<SettingsNavSearch onChange={setSidebarNavQuery} value={sidebarNavQuery} />
					</Stack>
					<ScrollFade aria-label="Settings sections" axis="block" className={styles.sidebarScroll}>
						<SettingsNav query={sidebarNavQuery} variant="sidebar" />
					</ScrollFade>
				</Box>
				<Box
					backgroundColor="surface.base"
					boxShadow={{ bp768: 'raised' }}
					className={styles.main}
					elementType="main"
					flexGrow="1"
					id={MAIN_ID}
					marginBlock={{ bp768: 'space.8' }}
					marginInlineEnd={{ bp768: 'space.8' }}
					minBlockSize="0"
					minInlineSize="0"
					overflow="hidden"
					tabIndex={-1}
				>
					<Box
						blockSize="100%"
						className={styles.mainScroll}
						overflowX="hidden"
						overflowY="auto"
						paddingBlockEnd={{ bp768: 'space.64', initial: 'space.48' }}
						paddingBlockStart={{ bp768: 'space.64', initial: 'space.16' }}
						paddingInline={{ bp768: 'space.40', initial: 'space.16' }}
						ref={mainRef}
					>
						{isMenu ? null : (
							<Box
								alignItems="center"
								display={{ bp768: 'none', initial: 'flex' }}
								gap="space.4"
								marginBlockEnd="space.16"
							>
								<RouterLink className={styles.mobileHeaderLink} to="/settings/menu">
									<Icon name="chevronLeft" size="xsmall" />
									Settings
								</RouterLink>
							</Box>
						)}
						<Container maxInlineSize="container.672">
							<Outlet context={preferencesContext satisfies SettingsOutletContext} />
						</Container>
					</Box>
				</Box>
			</Box>
		</>
	);
}

export function SettingsMenuPage() {
	const profile = useQuery(settingsQueryOptions).data!.profile;

	return (
		<Stack gap="space.24">
			<Heading level={1} shouldDisableTrim tabIndex={-1}>
				Settings
			</Heading>
			<AccountSummary profile={profile} />
			<SettingsNav variant="menu" />
		</Stack>
	);
}

function AccountSummary({ profile }: { profile: Settings['profile'] }) {
	return (
		<Stack gap="space.4" minInlineSize="0">
			<Text fontWeight="label" lineClamp>
				{profile.displayName}
			</Text>
			<Text color="secondary" fontWeight="body" lineClamp typography="caption">
				{profile.email}
			</Text>
		</Stack>
	);
}
