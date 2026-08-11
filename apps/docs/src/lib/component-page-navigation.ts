export interface ComponentPageNavigation {
	current: 'guide' | 'props';
	guideUrl: string;
	propsUrl: string;
}

export function getComponentPageNavigation(pageUrl: string): ComponentPageNavigation | null {
	const segments = pageUrl.split('/').filter(Boolean);
	const isGuide = segments.length === 3;
	const isProps = segments.length === 4 && segments[3] === 'props';

	if (segments[0] !== 'components' || (!isGuide && !isProps)) return null;

	const guideUrl = `/${segments.slice(0, 3).join('/')}`;
	return {
		current: isProps ? 'props' : 'guide',
		guideUrl,
		propsUrl: `${guideUrl}/props`,
	};
}

/** Pathname Fumadocs should use for page-tree matching. Props pages map to their guide. */
export function getDocsTreePathname(pathname: string): string {
	return getComponentPageNavigation(pathname)?.guideUrl ?? pathname;
}
