import { getStorybookBaseUrl } from './storybook.js';

export interface SiteDestination {
	activePath?: string;
	isExternal?: boolean;
	label: string;
	url: string;
}

export const siteDestinations: ReadonlyArray<SiteDestination> = [
	{ activePath: '/', label: 'Docs', url: '/' },
	{ activePath: '/components', label: 'Components', url: '/components' },
	{ activePath: '/playground', label: 'Playground', url: '/playground' },
	{
		isExternal: true,
		label: 'Storybook',
		url: `${getStorybookBaseUrl(import.meta.env.BASE_URL)}/`,
	},
];

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
