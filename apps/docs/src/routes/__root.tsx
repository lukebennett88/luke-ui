import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import paperCss from '@luke-ui/react/themes/paper/stylesheet.css?url';
import tactileCss from '@luke-ui/react/themes/tactile/stylesheet.css?url';
import { cx } from '@luke-ui/react/utils';
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import type { SharedProps } from 'fumadocs-ui/components/dialog/search';
import { RootProvider } from 'fumadocs-ui/provider/tanstack';
import type { ReactNode } from 'react';
import { lazy, Suspense } from 'react';
import { DocsThemeRoot } from '../components/theme-controls';
import themePrefsBootstrapScript from '../generated/theme-prefs-bootstrap-script.iife.js?raw';
import { withBasePath } from '../lib/base-path.js';
import { DEFAULT_THEME_PREFS, themeIdentityClassName } from '../lib/theme-prefs.js';
import appCss from '../styles/app.css?url';
import { docsRoot } from '../styles/docs-root.css.js';

const SearchDialog = lazy(() => import('../components/search'));

const loadThemePrefs = createServerFn({ method: 'GET' }).handler(async () => {
	const { readThemePrefsFromCookies } = await import('../lib/theme-prefs.server.js');
	return readThemePrefsFromCookies();
});

export const Route = createRootRoute({
	component: RootComponent,
	head: () => ({
		links: [
			{ href: appCss, rel: 'stylesheet' },
			// Tactile must stay last: before hydration, the last stylesheet's `:where(:root)`
			// fallback wins, and it has to match the default theme identity.
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
	loader: () => loadThemePrefs(),
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
	const themePrefs = Route.useLoaderData() ?? DEFAULT_THEME_PREFS;
	const identityClassName = themeIdentityClassName(themePrefs.themeIdentity);

	return (
		<html className={identityClassName} lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
				<script
					dangerouslySetInnerHTML={{ __html: themePrefsBootstrapScript }}
					suppressHydrationWarning
				/>
			</head>
			<body className={cx('flex min-h-dvh flex-col', docsRoot)}>
				<RootProvider
					search={{ SearchDialog: LazySearchDialog }}
					theme={{
						attribute: ['class', 'data-color-mode'],
						defaultTheme: themePrefs.colorMode,
						enableSystem: true,
						hotKey: false,
					}}
				>
					<IconSpritesheetProvider href={spriteSheetHref}>
						<DocsThemeRoot initialPrefs={themePrefs}>{children}</DocsThemeRoot>
					</IconSpritesheetProvider>
				</RootProvider>
				<Scripts />
			</body>
		</html>
	);
}
