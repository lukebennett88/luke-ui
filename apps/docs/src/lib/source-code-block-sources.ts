const sourceCodeBlockSrcPattern = /<SourceCodeBlock\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/g;

/** `src` values from `<SourceCodeBlock>` opening tags, including tags split across lines. */
export function sourceCodeBlockSources(contents: string): Array<string> {
	return [...contents.matchAll(sourceCodeBlockSrcPattern)].flatMap((match) => {
		const src = match[1];
		return src === undefined ? [] : [src];
	});
}
