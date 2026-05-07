import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { NotFound } from './components/not-found';
import { routeTree } from './routeTree.gen';

export function getRouter() {
	// Derive basePath from Vite's BASE_URL so TanStack Router knows about the
	// sub-path when deployed to environments like GitHub Pages (/luke-ui/).
	// Strip the trailing slash so the router receives e.g. '/luke-ui' not '/luke-ui/'.
	const basePath = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
	return createTanStackRouter({
		basepath: basePath,
		defaultNotFoundComponent: NotFound,
		defaultPreload: 'intent',
		routeTree,
		scrollRestoration: true,
	});
}
