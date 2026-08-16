const exampleBlockSrcPattern = /<ExampleBlock\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/g;

/** `src` values from `<ExampleBlock>` opening tags, including tags split across lines. */
export function exampleBlockSources(contents: string): Array<string> {
	return [...contents.matchAll(exampleBlockSrcPattern)].flatMap((match) => {
		const src = match[1];
		return src === undefined ? [] : [src];
	});
}
