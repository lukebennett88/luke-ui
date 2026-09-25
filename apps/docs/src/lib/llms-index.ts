const SEPARATOR_PATTERN = /^---(?:\[[^\]]+])?(?<name>.+)---$/;

/** A page within an `/llms.txt` section, as a single Markdown list entry. */
export interface LlmsIndexPage {
	description: string;
	markdownUrl: string;
	title: string;
}

/** One `## `-level section of `/llms.txt`, holding only a flat page list. */
export interface LlmsIndexSection {
	pages: ReadonlyArray<LlmsIndexPage>;
	title: string;
}

/**
 * Splits a Fumadocs `meta.json` `pages` array into the groups its
 * `"---Name---"` separators declare, dropping the separators themselves.
 * Pages listed before the first separator have no group and are omitted —
 * every group this project's `meta.json` files use starts with one.
 */
export function parseMetaGroups(pages: ReadonlyArray<string>): Array<{
	slugs: Array<string>;
	title: string;
}> {
	const groups: Array<{ slugs: Array<string>; title: string }> = [];

	for (const entry of pages) {
		const match = SEPARATOR_PATTERN.exec(entry);
		if (match) {
			groups.push({ slugs: [], title: match.groups?.name ?? '' });
			continue;
		}
		groups.at(-1)?.slugs.push(entry);
	}

	return groups;
}

/**
 * Assembles the `/llms.txt` body per llmstxt.org: a single `# Luke UI` H1, a
 * `> ` blockquote summary, then one `## ` section per docs or component
 * group containing only a flat Markdown list of pages, and a closing
 * `## Optional` section linking the full documentation.
 */
export function buildLlmsIndex(options: {
	intro: string;
	origin: string;
	sections: ReadonlyArray<LlmsIndexSection>;
}): string {
	const { intro, origin, sections } = options;

	const lines = ['# Luke UI', '', `> ${intro}`, ''];

	for (const section of sections) {
		if (section.pages.length === 0) continue;
		lines.push(`## ${section.title}`, '');
		for (const page of section.pages) {
			lines.push(formatListItem(page));
		}
		lines.push('');
	}

	lines.push('## Optional', '', `- [Full documentation](${origin}/llms-full.txt)`, '');

	return lines.join('\n');
}

function formatListItem(page: LlmsIndexPage): string {
	const description = page.description.trim();
	return description.length > 0
		? `- [${page.title}](${page.markdownUrl}): ${description}`
		: `- [${page.title}](${page.markdownUrl})`;
}
