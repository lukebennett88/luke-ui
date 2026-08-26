export interface FrontmatterBlock {
	key: string;
	lines: ReadonlyArray<string>;
}

export interface DocsFrontmatter {
	description?: string;
	source?: string;
	title?: string;
}

/** Splits a document's YAML fence into top-level `key:` blocks. */
export function parseFrontmatterBlocks(contents: string): ReadonlyArray<FrontmatterBlock> | null {
	const match = contents.match(/^---\n([\s\S]*?)\n---/);
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
		const topLevelKey = line.match(/^([A-Za-z]+):/)?.[1];
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

export interface PropsEntry {
	name: string;
	path: string;
}

export interface ComponentFrontmatter {
	/** Raw frontmatter lines for `description`, `reactAria`, `source`, and `title`, in file order. */
	copiedLines: ReadonlyArray<string>;
	props: ReadonlyArray<PropsEntry>;
}

export function parseComponentFrontmatter(contents: string): ComponentFrontmatter {
	const blocks = parseFrontmatterBlocks(contents);
	if (blocks === null) throw new Error('guide is missing frontmatter');

	const copiedLines: Array<string> = [];
	let props: ReadonlyArray<PropsEntry> = [];

	for (const block of blocks) {
		if (block.key === 'props') {
			props = parsePropsEntries(block.lines);
			continue;
		}
		if (
			block.key === 'description' ||
			block.key === 'reactAria' ||
			block.key === 'source' ||
			block.key === 'title'
		) {
			copiedLines.push(...block.lines);
		}
	}

	return { copiedLines, props };
}

/** Parses a `props:` block's `- name: … / path: …` list items, in file order. */
function parsePropsEntries(lines: ReadonlyArray<string>): ReadonlyArray<PropsEntry> {
	const entries: Array<Partial<PropsEntry>> = [];

	for (const line of lines) {
		const itemMatch = line.match(/^\s*-\s*(\w+):\s*(.+)$/);
		const fieldMatch = line.match(/^\s+(\w+):\s*(.+)$/);

		if (itemMatch?.[1] !== undefined && itemMatch[2] !== undefined) {
			entries.push({ [itemMatch[1]]: itemMatch[2] });
			continue;
		}

		if (fieldMatch?.[1] !== undefined && fieldMatch[2] !== undefined) {
			const lastEntry = entries[entries.length - 1];
			if (lastEntry === undefined) throw new Error(`props field with no entry: ${line}`);
			Object.assign(lastEntry, { [fieldMatch[1]]: fieldMatch[2] });
		}
	}

	return entries.map((entry) => {
		if (entry.name === undefined) throw new Error('props entry is missing name');
		if (entry.path === undefined) throw new Error('props entry is missing path');
		return { name: entry.name, path: entry.path };
	});
}
