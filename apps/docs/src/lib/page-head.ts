/** One `head()` meta entry: either the document title or a `<meta>` tag. */
export type PageHeadMeta = { title: string } | { content: string; name: string };

/** Data a docs page's `head()` needs from its loader. */
export interface PageHeadData {
	description: string | null;
	title: string;
}

const TITLE_SUFFIX = ' | Luke UI';

/**
 * Resolves a docs page's `<title>` and `<meta name="description">` from its frontmatter. Returns
 * no meta entries until the loader has resolved, and omits the description tag when the page has
 * none.
 */
export function resolvePageHeadMeta(data: PageHeadData | undefined): Array<PageHeadMeta> {
	if (!data) return [];

	return [
		{ title: `${data.title}${TITLE_SUFFIX}` },
		...(data.description ? [{ content: data.description, name: 'description' }] : []),
	];
}
