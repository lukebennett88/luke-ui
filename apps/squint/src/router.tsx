import { createRouter } from '@tanstack/react-router';
import { searchOptions } from './navigation/search.js';
import { routeTree } from './routeTree.gen.js';

export function getRouter() {
	return createRouter({ ...searchOptions, routeTree });
}

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
