import { themeRootClassName } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { RootProvider } from 'fumadocs-ui/provider/tanstack';
import type * as React from 'react';
import SearchDialog from '../components/search';
import appCss from '../styles/app.css?url';

export const Route = createRootRoute({
	component: RootComponent,
	head: () => ({
		links: [
			{ href: appCss, rel: 'stylesheet' },
		],
		meta: [
			{
				charSet: 'utf-8',
			},
			{
				content: 'width=device-width, initial-scale=1',
				name: 'viewport',
			},
			{
				title: 'Luke UI Docs',
			},
		],
	}),
});

function RootComponent() {
	return (
		<RootDocument>
			<Outlet />
		</RootDocument>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className={cx(themeRootClassName, 'flex min-h-screen flex-col')}>
				<RootProvider search={{ SearchDialog }}>{children}</RootProvider>
				<Scripts />
			</body>
		</html>
	);
}
