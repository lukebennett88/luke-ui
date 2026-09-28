/** Only strip search-owned highlight tags; JSX/generics in docs text must survive. */
const MARK_TAG_PATTERN = /<\/?mark>/gi;
const MARKDOWN_EMPHASIS_PATTERN = /\*\*|__|`/g;

/** Strips search highlight tags and markdown emphasis; leaves JSX/generic text intact. */
export function plainText(value: string) {
	return value.replace(MARK_TAG_PATTERN, '').replace(MARKDOWN_EMPHASIS_PATTERN, '');
}
