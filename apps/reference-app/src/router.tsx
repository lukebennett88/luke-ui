import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Heading } from '@luke-ui/react/heading';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { rootClassName } from '@luke-ui/react/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
	createBrowserRouter,
	isRouteErrorResponse,
	Link,
	redirect,
	useRouteError,
} from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { SettingsLayout } from './routes/settings-layout.js';
import { settingsLoader, settingsPageRoutes } from './routes/settings-routes.js';

const queryClient = new QueryClient();

function RedirectFallback() {
	return null;
}

const router = createBrowserRouter([
	{
		Component: RedirectFallback,
		ErrorBoundary: SettingsRouteError,
		HydrateFallback: RedirectFallback,
		loader: () => redirect('/settings/preferences'),
		path: '/',
	},
	{
		children: [
			{
				Component: RedirectFallback,
				HydrateFallback: RedirectFallback,
				index: true,
				loader: () => redirect('preferences'),
			},
			...settingsPageRoutes,
		],
		element: <SettingsLayout />,
		ErrorBoundary: SettingsRouteError,
		HydrateFallback: RedirectFallback,
		id: 'settings',
		loader: () => settingsLoader(queryClient),
		path: '/settings',
	},
]);

export function AppRouter() {
	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	);
}

function SettingsRouteError() {
	const error = useRouteError();
	const isNotFound = isRouteErrorResponse(error) && error.status === 404;

	return (
		<Stack
			className={rootClassName}
			elementType="main"
			gap="sp16"
			marginInline="auto"
			maxInlineSize="32rem"
			padding="sp32"
		>
			<Heading level={1} shouldDisableTrim typography="heading3">
				{isNotFound ? 'Page not found' : 'Settings could not load'}
			</Heading>
			<Text elementType="p">
				{isNotFound
					? 'This settings page does not exist.'
					: 'Settings are unavailable. Try again, or reload this page.'}
			</Text>
			<Box display="flex">
				{isNotFound ? (
					<Link to="/settings/preferences">
						<Text>Go to preferences</Text>
					</Link>
				) : (
					<Button onPress={() => window.location.reload()} size="small">
						Try again
					</Button>
				)}
			</Box>
		</Stack>
	);
}
