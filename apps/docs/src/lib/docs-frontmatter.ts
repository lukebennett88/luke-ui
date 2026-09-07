export interface FrontmatterBlock {
	key: string;
	lines: ReadonlyArray<string>;
}

export interface DocsFrontmatter {
	description?: string;
	source?: string;
	title?: string;
}

const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---/;
const FRONTMATTER_KEY_PATTERN = /^([A-Za-z]+):/;

/** Splits a document's YAML fence into top-level `key:` blocks. */
export function parseFrontmatterBlocks(contents: string): ReadonlyArray<FrontmatterBlock> | null {
	const match = contents.match(FRONTMATTER_PATTERN);
	if (!match?.[1]) return null;

	return groupFrontmatterBlocks(match[1].split('\n'));
}

/** Title, description, and source from a docs MDX file. */
export function readFrontmatter(contents: string): DocsFrontmatter {
	return {
		description: readFrontmatterValue(contents, 'description'),
		source: readFrontmatterValue(contents, 'source'),
		title: readFrontmatterValue(contents, 'title'),
	};
}

function groupFrontmatterBlocks(lines: ReadonlyArray<string>): ReadonlyArray<FrontmatterBlock> {
	const blocks: Array<{ key: string; lines: Array<string> }> = [];

	for (const line of lines) {
		const topLevelKey = line.match(FRONTMATTER_KEY_PATTERN)?.[1];
		if (topLevelKey !== undefined) {
			blocks.push({ key: topLevelKey, lines: [line] });
			continue;
		}

		const lastBlock = blocks[blocks.length - 1];
		if (lastBlock === undefined) throw new Error(`Frontmatter continuation with no key: ${line}`);
		lastBlock.lines.push(line);
	}

	return blocks;
}

function readFrontmatterValue(contents: string, key: keyof DocsFrontmatter): string | undefined {
	const blocks = parseFrontmatterBlocks(contents);
	const block = blocks?.find((entry) => entry.key === key);
	if (block === undefined) return undefined;

	const keyPrefix = `${key}:`;
	const firstLine = block.lines[0] ?? '';
	const inlineValue = firstLine.slice(keyPrefix.length).trim();
	if (inlineValue) return inlineValue;

	return block.lines
		.slice(1)
		.map((line) => line.trim())
		.join(' ');
}
