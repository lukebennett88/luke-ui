/**
 * The site's public origin, with no trailing slash, for absolute URLs in
 * `llms.txt`, `sitemap.xml`, `robots.txt`, and Markdown 404 bodies. It is the
 * `SITE_URL` build-time value, or `http://localhost:3000` when that is unset.
 */
export function siteUrl(): string {
	return import.meta.env.SITE_URL;
}
