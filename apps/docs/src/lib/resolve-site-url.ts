const TRAILING_SLASH_PATTERN = /\/$/;

/**
 * Combines a site origin and a Vite-style base path into the public site root
 * without a trailing slash.
 */
export function resolveSiteUrl(origin: string, basePath = '/'): string {
	return `${origin.replace(TRAILING_SLASH_PATTERN, '')}${basePath}`.replace(
		TRAILING_SLASH_PATTERN,
		'',
	);
}
