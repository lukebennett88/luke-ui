const LEADING_SLASH_PATTERN = /^\//;

/**
 * Prefixes a root-relative public path with the app's configured base path
 * (`import.meta.env.BASE_URL`), so links keep working when the site deploys
 * under a sub-path such as `/luke-ui/`.
 */
export function withBasePath(publicPath: string, basePath: string): string {
	if (basePath === '/' || basePath === '') return publicPath;
	const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
	return `${normalizedBase}${publicPath.replace(LEADING_SLASH_PATTERN, '')}`;
}
