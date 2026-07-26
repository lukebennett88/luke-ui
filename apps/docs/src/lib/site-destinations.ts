import { getStorybookBaseUrl } from './storybook.js';

/** A top-level place the site navigates to. */
export interface SiteDestination {
	/**
	 * Marks the destination active while the pathname is at or below this path.
	 * Omitted for destinations outside the app, which are never active.
	 */
	activePath?: string;
	isExternal?: boolean;
	label: string;
	url: string;
}

/**
 * The site's primary destinations, in nav order. Shared by the nav and the docs
 * layout, so the layout's mobile sidebar drawer offers the same set the nav does.
 */
export const siteDestinations: ReadonlyArray<SiteDestination> = [
	{ activePath: '/', label: 'Docs', url: '/' },
	{ activePath: '/playground', label: 'Playground', url: '/playground' },
	{
		isExternal: true,
		label: 'Storybook',
		url: `${getStorybookBaseUrl(import.meta.env.BASE_URL)}/`,
	},
];

/**
 * The destination a pathname belongs to. The longest matching `activePath` wins,
 * so `/playground` beats the `/` docs root, which covers every other route.
 */
export function getActiveSiteDestination(pathname: string): SiteDestination | undefined {
	let match: SiteDestination | undefined;

	for (const destination of siteDestinations) {
		const { activePath } = destination;
		if (activePath === undefined) continue;
		if (!isAtOrBelow(pathname, activePath)) continue;
		if (match?.activePath !== undefined && match.activePath.length >= activePath.length) continue;
		match = destination;
	}

	return match;
}

function isAtOrBelow(pathname: string, activePath: string): boolean {
	if (activePath === '/') return true;
	return pathname === activePath || pathname.startsWith(`${activePath}/`);
}
