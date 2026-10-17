/** One `head()` meta entry: either the document title or a `<meta>` tag. */
export type PageHeadMeta =
	| { title: string }
	| { content: string; name: string }
	| { content: string; property: string };

/** Data a docs page's `head()` needs from its loader. */
export interface PageHeadData {
	description: string | null;
	title: string;
	url?: string;
}

/**
 * Resolves page identity metadata. Only pages with a known canonical URL get Open Graph identity.
 */
export function resolvePageHeadMeta(data: PageHeadData | undefined): Array<PageHeadMeta> {
	if (!data) return [];

	return [
		{ title: data.title },
		...(data.description ? [{ content: data.description, name: 'description' }] : []),
		...(data.url
			? [
					{ content: 'website', property: 'og:type' },
					{ content: data.title, property: 'og:title' },
					{ content: data.url, property: 'og:url' },
					...(data.description ? [{ content: data.description, property: 'og:description' }] : []),
				]
			: []),
	];
}
