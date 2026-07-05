export function withBasePath(publicPath: string, basePath: string): string {
	if (basePath === '/' || basePath === '') return publicPath;
	const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
	return `${normalizedBase}${publicPath.replace(/^\//, '')}`;
}

export function internalSegmentsToSourceSlugs(segments: Array<string>): Array<string> {
	return segments.length === 1 && segments[0] === 'index' ? [] : segments;
}
