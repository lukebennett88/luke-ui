import { Box } from '@luke-ui/react/box';
import { Container } from '@luke-ui/react/container';
import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { Link } from '@luke-ui/react/link';
import { ScrollFade } from '@luke-ui/react/scroll-fade';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { rootClassName, vars } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, Link as RouterLink, useLocation } from 'react-router';
import type { Preferences, Settings } from '../api/schemas.js';
import { applyInterfaceSettings, settingsApi } from '../api/settings-api.js';
import { settingsQueryKey, settingsQueryOptions } from '../api/settings-query.js';
import { SETTINGS_NAV, SettingsNav, SettingsNavSearch } from '../components/settings-nav.js';
import * as styles from '../styles/settings.css.js';

const MAIN_ID = 'settings-main';
const PREFERENCES_MUTATION_KEY = [...settingsQueryKey, 'preferences'] as const;

export type SettingsOutletContext = {
	preferences: Preferences;
	isPreferencesPending: boolean;
	preferencesError?: string;
	resetPreferencesStatus: () => void;
	savePreferences: (patch: Partial<Preferences>) => void;
};

export function SettingsLayout() {
	const { pathname } = useLocation();
	const queryClient = useQueryClient();
	const settings = useQuery(settingsQueryOptions).data!;
	const preferencesMutation = useMutation({
		mutationKey: PREFERENCES_MUTATION_KEY,
		mutationFn: (patch: Partial<Preferences>) => settingsApi.updatePreferences(patch),
		onSuccess: (nextSettings) => queryClient.setQueryData(settingsQueryKey, nextSettings),
	});
	const isPreferencesPending =
		useIsMutating({ exact: true, mutationKey: PREFERENCES_MUTATION_KEY }) > 0;
	const preferences = useMemo(() => {
		return preferencesMutation.isPending
			? { ...settings.preferences, ...preferencesMutation.variables }
			: settings.preferences;
	}, [preferencesMutation.isPending, preferencesMutation.variables, settings.preferences]);

	useEffect(() => {
		applyInterfaceSettings(preferences);
	}, [preferences]);
	const current = SETTINGS_NAV.find((item) => item.to === pathname);
	const isMenu = pathname === '/settings/menu';
	const mainRef = useRef<HTMLDivElement>(null);
	const previousPathname = useRef(pathname);
	const [sidebarNavQuery, setSidebarNavQuery] = useState('');

	function savePreferences(patch: Partial<Preferences>) {
		if (isPreferencesPending) return;
		preferencesMutation.reset();
		preferencesMutation.mutate(patch);
	}

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
				backgroundColor="surface.canvas"
				blockSize="100%"
				className={cx(rootClassName, styles.shell)}
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
					gap="sp24"
					color={vars.color.text.secondary}
					inlineSize="244px"
					minBlockSize={0}
					overflow="hidden"
					paddingBlock="sp16"
				>
					<Stack className={styles.sidebarHeader} flexShrink="0" gap="sp12">
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
					backgroundColor="surface.floating"
					boxShadow={{ bp768: 'raised' }}
					className={styles.main}
					elementType="main"
					flexGrow="1"
					id={MAIN_ID}
					marginBlock={{ bp768: 'sp8' }}
					marginInlineEnd={{ bp768: 'sp8' }}
					minBlockSize={0}
					minInlineSize={0}
					overflow="hidden"
					tabIndex={-1}
				>
					<Box
						blockSize="100%"
						className={styles.mainScroll}
						overflowX="hidden"
						overflowY="auto"
						paddingBlockEnd={{ bp768: 'sp64', initial: 'sp48' }}
						paddingBlockStart={{ bp768: 'sp64', initial: 'sp16' }}
						paddingInline={{ bp768: 'sp40', initial: 'sp16' }}
						ref={mainRef}
					>
						{isMenu ? null : (
							<Box
								alignItems="center"
								display={{ bp768: 'none', initial: 'flex' }}
								gap="sp4"
								marginBlockEnd="sp16"
							>
								<RouterLink className={styles.mobileHeaderLink} to="/settings/menu">
									<Icon name="chevronLeft" size="xsmall" />
									Settings
								</RouterLink>
							</Box>
						)}
						<Container maxInlineSize="ct672">
							<Outlet
								context={
									{
										preferences,
										isPreferencesPending,
										preferencesError:
											preferencesMutation.error instanceof Error
												? preferencesMutation.error.message
												: undefined,
										resetPreferencesStatus: preferencesMutation.reset,
										savePreferences,
									} satisfies SettingsOutletContext
								}
							/>
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
		<Stack gap="sp24">
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
		<Stack gap="sp4" minInlineSize="0">
			<Text fontWeight="label" lineClamp>
				{profile.displayName}
			</Text>
			<Text color="secondary" fontWeight="body" lineClamp typography="caption">
				{profile.email}
			</Text>
		</Stack>
	);
}
