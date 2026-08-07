import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import paperCss from '@luke-ui/react/themes/paper/stylesheet.css?url';
import tactileCss from '@luke-ui/react/themes/tactile/stylesheet.css?url';
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import type { SharedProps } from 'fumadocs-ui/components/dialog/search';
import { RootProvider } from 'fumadocs-ui/provider/tanstack';
import type { ReactNode } from 'react';
import { lazy, Suspense } from 'react';
import { DocsThemeRoot } from '../components/theme-controls';
import { withBasePath } from '../lib/base-path.js';
import appCss from '../styles/app.css?url';

const SearchDialog = lazy(() => import('../components/search'));

export const Route = createRootRoute({
	component: RootComponent,
	head: () => ({
		links: [
			{ href: appCss, rel: 'stylesheet' },
			// Tactile must stay last: before hydration, the last stylesheet's `:where(:root)`
			// fallback wins, and it has to match what `getServerThemeIdentity` returns.
			{ href: paperCss, rel: 'stylesheet' },
			{ href: tactileCss, rel: 'stylesheet' },
			{
				href: withBasePath('/favicon.svg', import.meta.env.BASE_URL),
				rel: 'icon',
				type: 'image/svg+xml',
			},
			{
				href: withBasePath('/favicon-dark.svg', import.meta.env.BASE_URL),
				media: '(prefers-color-scheme: dark)',
				rel: 'icon',
			},
			{
				href: withBasePath('/apple-touch-icon.png', import.meta.env.BASE_URL),
				rel: 'apple-touch-icon',
			},
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
