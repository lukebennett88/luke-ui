import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import logo from '../assets/squint-logo.png';

export const Route = createRootRoute({
	component: RootComponent,
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ content: 'width=device-width, initial-scale=1', name: 'viewport' },
			{ content: 'noindex', name: 'robots' },
			{ title: 'Squint' },
		],
		links: [{ href: logo, rel: 'icon', type: 'image/png' }],
	}),
	shellComponent: RootDocument,
});

function RootComponent() {
	return <Outlet />;
}

function RootDocument({ children }: { children: ReactNode }) {
	return (
		// The identity class of the app theme, `src/theme/input.ts`.
		<html className="luke-ui-theme-visual-review" lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}
