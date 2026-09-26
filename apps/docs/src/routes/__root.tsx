import { subscribeToSchemeChange } from '@epic-web/client-hints/color-scheme';
import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import paperCss from '@luke-ui/react/themes/paper/stylesheet.css?url';
import tactileCss from '@luke-ui/react/themes/tactile/stylesheet.css?url';
import { cx } from '@luke-ui/react/utils';
import { createRootRoute, HeadContent, Outlet, Scripts, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import type { SharedProps } from 'fumadocs-ui/components/dialog/search';
import { RootProvider } from 'fumadocs-ui/provider/tanstack';
import type { ReactNode } from 'react';
import { lazy, Suspense, useCallback, useEffect } from 'react';
import * as z from 'zod';
import { DocsThemeProvider, DocsThemeRoot, useDocsTheme } from '../components/theme-controls';
import { withBasePath } from '../lib/base-path.js';
import type { ThemePrefsUpdate } from '../lib/theme-prefs.js';
import { clientHintCheckScript, themeIdentityClassName } from '../lib/theme-prefs.js';
import { readThemePrefs, writeThemePrefs } from '../lib/theme-prefs.server.js';
import appCss from '../styles/app.css?url';
import { docsRoot } from '../styles/docs-root.css.js';

const SearchDialog = lazy(() => import('../components/search'));

const loadThemePrefs = createServerFn({ method: 'GET' }).handler(() => readThemePrefs());

const saveThemePrefs = createServerFn({ method: 'POST' })
	.validator((update) =>
		z
			.object({
				colorModePreference: z.enum(['light', 'dark', 'system']).optional(),
				themeIdentity: z.enum(['paper', 'tactile']).optional(),
			})
			.parse(update),
	)
	.handler(({ data }) => writeThemePrefs(data));

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
	loader: () => loadThemePrefs(),
	// Prefs change only through `router.invalidate()`, so navigation need not refetch them.
	staleTime: Number.POSITIVE_INFINITY,
});

function RootComponent() {
	const prefs = Route.useLoaderData();
	const router = useRouter();
	const persistThemePrefs = useCallback(
		async (update: ThemePrefsUpdate) => {
			await saveThemePrefs({ data: update });
			await router.invalidate();
		},
		[router],
	);

	// Keeps the client hint cookie current so the next server render resolves `system` correctly.
	useEffect(() => subscribeToSchemeChange(() => void router.invalidate()), [router]);

	return (
		<DocsThemeProvider onPrefsChange={persistThemePrefs} prefs={prefs}>
			<RootDocument>
				<Outlet />
			</RootDocument>
		</DocsThemeProvider>
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
	const { resolvedColorMode, themeIdentity } = useDocsTheme();

	return (
		// The identity class sits on `<html>` so body-level portals inherit it. Fumadocs styles key
		// off the `light`/`dark` class; Luke UI keys off `data-color-mode`.
		<html
			className={cx(themeIdentityClassName(themeIdentity), resolvedColorMode)}
			data-color-mode={resolvedColorMode}
			lang="en"
			style={{ colorScheme: resolvedColorMode }}
			suppressHydrationWarning
		>
			<head>
				<HeadContent />
				<script dangerouslySetInnerHTML={{ __html: clientHintCheckScript }} />
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
