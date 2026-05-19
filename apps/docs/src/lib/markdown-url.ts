const DOCS_MARKDOWN_PREFIX = '/docs/';
const DOCS_MARKDOWN_SUFFIX = '.md';
const INTERNAL_MARKDOWN_PREFIX = '/llms.mdx/';

export function toPublic(slug: string): string {
	return slug === 'index' ? '/docs.md' : `${DOCS_MARKDOWN_PREFIX}${slug}${DOCS_MARKDOWN_SUFFIX}`;
}

export function toInternal(publicPath: string): string | null {
	const slug = publicToSlug(publicPath);
	return slug ? `${INTERNAL_MARKDOWN_PREFIX}${slug}` : null;
}

export function mapPublicToInternal(url: string | undefined): string | null {
	if (!url) return null;
	const [pathname, suffix = ''] = url.split(/(?=[?#])/);
	const internalPath = toInternal(pathname ?? '');
	return internalPath ? `${internalPath}${suffix}` : null;
}

export function internalSegmentsToSourceSlugs(segments: Array<string>): Array<string> {
	return segments.length === 1 && segments[0] === 'index' ? [] : segments;
}

function publicToSlug(publicPath: string): string | null {
	if (publicPath === '/docs.md') return 'index';
	if (!publicPath.startsWith(DOCS_MARKDOWN_PREFIX)) return null;
	if (!publicPath.endsWith(DOCS_MARKDOWN_SUFFIX)) return null;
	return publicPath.slice(DOCS_MARKDOWN_PREFIX.length, -DOCS_MARKDOWN_SUFFIX.length);
}
