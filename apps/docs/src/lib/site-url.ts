/**
 * The configured site origin and base path, without a trailing slash.
 * Production defaults to `https://ui.lukebennett.dev`, development to `http://localhost:3000`.
 */
export function siteUrl(): string {
	return `${import.meta.env.SITE_URL}${import.meta.env.BASE_URL}`.replace(
		TRAILING_SLASH_PATTERN,
		'',
	);
}

const TRAILING_SLASH_PATTERN = /\/$/;
