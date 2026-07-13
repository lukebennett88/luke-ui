import '@luke-ui/react/themes/elmo.css';
import '@luke-ui/react/themes/machined-edge.css';
import { themeRootClassName } from '@luke-ui/react/theme';
import { elmoThemeClassName, machinedEdgeThemeClassName } from '@luke-ui/react/themes';
import { cx } from '@luke-ui/react/utils';
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import type { SharedProps } from 'fumadocs-ui/components/dialog/search';
import { RootProvider } from 'fumadocs-ui/provider/tanstack';
import type { ReactNode } from 'react';
import { lazy, Suspense, useState } from 'react';
import type { ColorMode, ThemeName } from '../components/theme-controls';
import { ThemeSettingsProvider } from '../components/theme-controls';
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
	const [colorMode, setColorMode] = useState<ColorMode>('light');
	const [theme, setTheme] = useState<ThemeName>('machined-edge');
	const themeClassName =
		theme === 'machined-edge' ? machinedEdgeThemeClassName : elmoThemeClassName;

	return (
		<html className={colorMode === 'dark' ? 'dark' : undefined} lang="en">
			<head>
				<HeadContent />
			</head>
			<body
				className={cx(themeRootClassName, themeClassName, 'flex min-h-screen flex-col')}
				data-color-mode={colorMode}
			>
				<ThemeSettingsProvider value={{ colorMode, setColorMode, setTheme, theme }}>
					<RootProvider search={{ SearchDialog: LazySearchDialog }} theme={{ enabled: false }}>
						{children}
					</RootProvider>
				</ThemeSettingsProvider>
				<Scripts />
			</body>
		</html>
	);
}
