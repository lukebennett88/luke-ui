/**
 * Maps a package-doc slug (e.g. 'button') to the hosted-page URL.
 * Used by RenderMarkdown to rewrite intra-doc links from package-relative to hosted URLs.
 */
export const packageDocSlugMap: ReadonlyMap<string, string> = new Map([
	['button', '/docs/components/actions/button'],
	['close-button', '/docs/components/actions/close-button'],
	['icon-button', '/docs/components/actions/icon-button'],
	['link', '/docs/components/actions/link'],
	['loading-spinner', '/docs/components/feedback/loading-spinner'],
	['combobox-field', '/docs/components/forms/combobox-field'],
	['text-field', '/docs/components/forms/text-field'],
	['emoji', '/docs/components/typography/emoji'],
	['heading', '/docs/components/typography/heading'],
	['numeral', '/docs/components/typography/numeral'],
	['text', '/docs/components/typography/text'],
	['icon', '/docs/components/visuals/icon'],
]);
