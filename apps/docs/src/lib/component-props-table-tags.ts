const API_HEADING_PATTERN = /^##\s+API\s*$/m;
const HEADING_PATTERN = /^##\s+.+$/gm;
const PROPS_TABLE_TAG_PATTERN = /<component-props-table\b[^>]*\/>/g;
const PATH_ATTRIBUTE_PATTERN = /\bpath\s*=\s*["']([^"']+)["']/;
const NAME_ATTRIBUTE_PATTERN = /\bname\s*=\s*["']([^"']+)["']/;

export interface ComponentPropsTableTag {
	name: string;
	path: string;
}

/** `<component-props-table>` entries inside a guide's `## API` section, in file order. */
export function findComponentPropsTableTags(source: string): Array<ComponentPropsTableTag> {
	const section = apiSection(source);
	if (section === undefined) return [];

	return [...section.matchAll(PROPS_TABLE_TAG_PATTERN)].map((match) => {
		const path = PATH_ATTRIBUTE_PATTERN.exec(match[0])?.[1];
		const name = NAME_ATTRIBUTE_PATTERN.exec(match[0])?.[1];
		if (path === undefined || name === undefined) {
			throw new Error('component-props-table tag is missing path or name');
		}
		return { name, path };
	});
}

/** The `## API` section body, from its heading up to the next `##` heading or end of file. */
function apiSection(source: string): string | undefined {
	const headingMatch = API_HEADING_PATTERN.exec(source);
	if (headingMatch === null) return undefined;

	const start = headingMatch.index + headingMatch[0].length;
	HEADING_PATTERN.lastIndex = start;
	const nextHeading = HEADING_PATTERN.exec(source);
	return source.slice(start, nextHeading?.index ?? source.length);
}
