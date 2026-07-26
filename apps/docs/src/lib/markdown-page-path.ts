export function getMarkdownPagePath(relativePath: string): string {
	const withoutExtension = relativePath.slice(0, -'.mdx'.length);
	const pagePath = withoutExtension.endsWith('/index')
		? withoutExtension.slice(0, -'/index'.length)
		: withoutExtension;
	return `/${pagePath}.md`;
}
