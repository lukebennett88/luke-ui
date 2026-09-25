const XML_ESCAPE_PATTERN = /[&<>"']/g;
const XML_ESCAPES: Record<string, string> = {
	'"': '&quot;',
	'&': '&amp;',
	"'": '&apos;',
	'<': '&lt;',
	'>': '&gt;',
};

/** A page to list in the sitemap. `lastModified` is omitted when unknown. */
export interface SitemapPage {
	lastModified?: Date | null;
	url: string;
}

/**
 * Builds a sitemaps.org 0.9 protocol document. Every URL is absolute and
 * trailing-slashed, except the homepage, matching the URL Netlify serves
 * with a 200 instead of a redirect.
 */
export function buildSitemap(origin: string, pages: Array<SitemapPage>): string {
	const entries = pages.map((page) => buildUrlEntry(origin, page)).join('');

	return (
		'<?xml version="1.0" encoding="UTF-8"?>\n' +
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
		entries +
		'</urlset>\n'
	);
}

function buildUrlEntry(origin: string, page: SitemapPage): string {
	const loc = escapeXml(`${origin}${sitemapPath(page.url)}`);
	const lastmod = page.lastModified
		? `\n    <lastmod>${page.lastModified.toISOString()}</lastmod>`
		: '';
	return `  <url>\n    <loc>${loc}</loc>${lastmod}\n  </url>\n`;
}

function sitemapPath(url: string): string {
	if (url === '/') return '/';
	return url.endsWith('/') ? url : `${url}/`;
}

function escapeXml(value: string): string {
	return value.replace(XML_ESCAPE_PATTERN, (char) => XML_ESCAPES[char] ?? char);
}
