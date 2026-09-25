const FALLBACK_SITE_URL = 'https://luke-ui.netlify.app';

/**
 * The production origin, with no trailing slash. Netlify sets `URL` at build
 * time; the fallback covers local builds. Only used from prerendered server
 * handlers, which build absolute URLs from it.
 */
export function siteUrl(): string {
	return process.env.URL ?? FALLBACK_SITE_URL;
}
