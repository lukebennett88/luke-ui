const RELATIVE_MD_LINK = /\]\(\.\/([a-z0-9-]+)\.md\)/gi;

export function rewritePackageDocLinks(markdown: string, slugMap: Map<string, string>): string {
	return markdown.replace(RELATIVE_MD_LINK, (match, slug: string) => {
		const hosted = slugMap.get(slug);
		return hosted ? `](${hosted})` : match;
	});
}
