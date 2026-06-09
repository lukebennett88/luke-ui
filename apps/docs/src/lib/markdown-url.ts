const DOCS_MARKDOWN_PREFIX = '/docs/';
const DOCS_MARKDOWN_SUFFIX = '.md';
const INTERNAL_MARKDOWN_PREFIX = '/markdown/';

export function toPublic(slug: string): string {
	return slug === 'index' ? '/docs.md' : `${DOCS_MARKDOWN_PREFIX}${slug}${DOCS_MARKDOWN_SUFFIX}`;
}

export function withBasePath(publicPath: string, basePath: string): string {
	if (basePath === '/' || basePath === '') return publicPath;
	const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
	return `${normalizedBase}${publicPath.replace(/^\//, '')}`;
}

export function toInternal(publicPath: string, basePath = '/'): string | null {
	const slug = publicToSlug(publicPath, basePath);
	return slug ? `${INTERNAL_MARKDOWN_PREFIX}${slug}` : null;
}

export function mapPublicToInternal(url: string | undefined, basePath = '/'): string | null {
	if (!url) return null;
	const [pathname, suffix = ''] = url.split(/(?=[?#])/);
	const internalPath = toInternal(pathname ?? '', basePath);
	return internalPath ? `${internalPath}${suffix}` : null;
}

export function internalSegmentsToSourceSlugs(segments: Array<string>): Array<string> {
	return segments.length === 1 && segments[0] === 'index' ? [] : segments;
}

function publicToSlug(publicPath: string, basePath: string): string | null {
	const path = stripBasePath(publicPath, basePath);
	if (path === '/docs.md') return 'index';
	if (!path.startsWith(DOCS_MARKDOWN_PREFIX)) return null;
	if (!path.endsWith(DOCS_MARKDOWN_SUFFIX)) return null;
	return path.slice(DOCS_MARKDOWN_PREFIX.length, -DOCS_MARKDOWN_SUFFIX.length);
}

function stripBasePath(path: string, basePath: string): string {
	if (basePath === '/' || basePath === '') return path;
	const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
	if (path === normalizedBase) return '/';
	if (!path.startsWith(`${normalizedBase}/`)) return path;
	return path.slice(normalizedBase.length);
}
