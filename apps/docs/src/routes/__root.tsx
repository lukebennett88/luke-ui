import '@luke-ui/react/themes/paper.css';
import '@luke-ui/react/themes/tactile.css';
import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import type { SharedProps } from 'fumadocs-ui/components/dialog/search';
import { RootProvider } from 'fumadocs-ui/provider/tanstack';
import type { ReactNode } from 'react';
import { lazy, Suspense } from 'react';
import { DocsThemeRoot } from '../components/theme-controls';
import appCss from '../styles/app.css?url';

const SearchDialog = lazy(() => import('../components/search'));

export const Route = createRootRoute({
	component: RootComponent,
	head: () => ({
		links: [{ href: appCss, rel: 'stylesheet' }],
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

function LazySearchDialog(props: SharedProps) {
	return (
		<Suspense fallback={null}>
			<SearchDialog {...props} />
		</Suspense>
	);
}

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="flex min-h-screen flex-col">
				<RootProvider
					search={{ SearchDialog: LazySearchDialog }}
					theme={{ attribute: ['class', 'data-color-mode'] }}
				>
					<IconSpritesheetProvider href={spriteSheetHref}>
						<DocsThemeRoot>{children}</DocsThemeRoot>
					</IconSpritesheetProvider>
				</RootProvider>
				<Scripts />
			</body>
		</html>
	);
}
