const SOURCE_CODE_BLOCK_SRC_PATTERN = /<SourceCodeBlock\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/g;

/** `src` values from `<SourceCodeBlock>` opening tags, including tags split across lines. */
export function sourceCodeBlockSources(contents: string): Array<string> {
	return [...contents.matchAll(SOURCE_CODE_BLOCK_SRC_PATTERN)].flatMap((match) => {
		const src = match[1];
		return src === undefined ? [] : [src];
	});
}
