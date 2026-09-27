import { formatPlaygroundSource } from '@luke-ui/playground-core/format';
import type { PlaygroundFormatOptions } from '@luke-ui/playground-core/format';

/** The docs playground's Prettier style, matching the repo's own formatting. */
const DOCS_PLAYGROUND_FORMAT_OPTIONS = {
	arrowParens: 'always',
	bracketSameLine: false,
	bracketSpacing: true,
	jsxSingleQuote: false,
	printWidth: 100,
	quoteProps: 'as-needed',
	semi: true,
	singleAttributePerLine: false,
	singleQuote: true,
	tabWidth: 2,
	trailingComma: 'all',
	useTabs: true,
} as const satisfies PlaygroundFormatOptions;

/** Formats docs playground source. Returns `null` when the source does not parse. */
export function formatDocsPlaygroundSource(source: string): Promise<string | null> {
	return formatPlaygroundSource(source, DOCS_PLAYGROUND_FORMAT_OPTIONS);
}
