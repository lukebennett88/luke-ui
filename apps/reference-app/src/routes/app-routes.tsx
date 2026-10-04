import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Heading } from '@luke-ui/react/heading';
import { Link } from '@luke-ui/react/link';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { rootClassName } from '@luke-ui/react/theme';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { RouteObject } from 'react-router';
import { isRouteErrorResponse, redirect, useRouteError } from 'react-router';
import { settingsQueryOptions } from '../api/settings-query.js';
import { HomePage } from './home.js';
import { PreferencesPage } from './preferences.js';
import { ProfilePage } from './profile.js';
import { RootLayout } from './root-layout.js';
import { SecurityPage } from './security.js';
import { SettingsLayout, SettingsMenuPage } from './settings-layout.js';

/** Route tree shared by the browser router and the test harness. */
export function createAppRoutes(queryClient: QueryClient): Array<RouteObject> {
	return [
		{
			children: [
				{ element: <HomePage />, index: true },
				{
					children: [
						{ HydrateFallback, index: true, loader: () => redirect('preferences') },
						{ element: <SettingsMenuPage />, path: 'menu' },
						{ element: <PreferencesPage />, path: 'preferences' },
						{ element: <ProfilePage />, path: 'profile' },
						{ element: <SecurityPage />, path: 'security' },
					],
					element: <SettingsLayout />,
					id: 'settings',
					path: 'settings',
				},
				{ Component: NotFound, path: '*' },
			],
			ErrorBoundary: RouteError,
			element: <RootLayout />,
			HydrateFallback,
			loader: async () => {
				await queryClient.query(settingsQueryOptions);
			},
			path: '/',
		},
	];
}

function HydrateFallback() {
	return null;
}

function RouteError() {
	const error = useRouteError();
	if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />;

	return (
		<ErrorPage
			action={
				<Button onPress={() => window.location.reload()} size="small">
					Try again
				</Button>
			}
			message="Settings are unavailable. Try again, or reload this page."
			title="Settings could not load"
		/>
	);
}

function NotFound() {
	return (
		<ErrorPage
			action={<Link href="/">Go to home</Link>}
			message="This page does not exist."
			title="Page not found"
		/>
	);
}

function ErrorPage({
	action,
	message,
	title,
}: {
	action: ReactNode;
	message: string;
	title: string;
}) {
	return (
		<Stack
			className={rootClassName}
			elementType="main"
			gap="sp16"
			marginInline="auto"
			maxInlineSize="32rem"
			padding="sp32"
		>
			<title>{title}</title>
			<Heading level={1} shouldDisableTrim typography="heading3">
				{title}
			</Heading>
			<Text elementType="p">{message}</Text>
			<Box display="flex">{action}</Box>
		</Stack>
	);
}
