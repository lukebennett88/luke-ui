import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import paperCss from '@luke-ui/react/themes/paper/stylesheet.css?url';
import tactileCss from '@luke-ui/react/themes/tactile/stylesheet.css?url';
import { cx } from '@luke-ui/react/utils';
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import type { SharedProps } from 'fumadocs-ui/components/dialog/search';
import { RootProvider } from 'fumadocs-ui/provider/tanstack';
import type { ReactNode } from 'react';
import { lazy, Suspense } from 'react';
import { DocsThemeRoot } from '../components/theme-controls';
import themePrefsScript from '../generated/theme-prefs-script.iife.js?raw';
import { withBasePath } from '../lib/base-path.js';
import appCss from '../styles/app.css?url';
import { docsRoot } from '../styles/docs-root.css.js';

const SearchDialog = lazy(() => import('../components/search'));

export const Route = createRootRoute({
	component: RootComponent,
	head: () => ({
		links: [
			{ href: appCss, rel: 'stylesheet' },
			// Tactile must stay last: an element without an identity class gets the last
			// stylesheet's `:where(:root)` fallback, and Tactile is the default identity.
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
		// `themePrefsScript` and the theme prefs store own the classes and attributes on `<html>`.
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
				<script dangerouslySetInnerHTML={{ __html: themePrefsScript }} />
			</head>
			<body className={cx('flex min-h-dvh flex-col', docsRoot)}>
				<RootProvider search={{ SearchDialog: LazySearchDialog }} theme={{ enabled: false }}>
					<IconSpritesheetProvider href={spriteSheetHref}>
						<DocsThemeRoot>{children}</DocsThemeRoot>
					</IconSpritesheetProvider>
				</RootProvider>
				<Scripts />
			</body>
		</html>
	);
}
