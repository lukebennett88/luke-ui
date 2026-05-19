import type { DiscoveredExport } from './discover-exports.js';
import { slugToTitle } from './title.js';

export interface IndexEntry extends DiscoveredExport {
	description?: string;
	href?: string;
}

export interface RenderIndexInput {
	packageName: string;
	entries: Array<IndexEntry>;
	includeLibraryAuthors: boolean;
}

const ASSET_NOTES: Record<string, string> = {
	'./stylesheet.css': "required side-effect import: `import '@luke-ui/react/stylesheet.css'`",
	'./spritesheet.svg':
		'sprite sheet referenced by the `Icon` atom; bundlers resolve this automatically.',
	'./package.json': 'package manifest export, used by tooling — no docs.',
};

export function renderIndex(input: RenderIndexInput): string {
	const { packageName, entries, includeLibraryAuthors } = input;
	const lines: Array<string> = [];
	lines.push(`# ${packageName}`);
	lines.push('');

	const primary: Array<IndexEntry> = [];
	const primitives: Array<IndexEntry> = [];
	const barrels: Array<IndexEntry> = [];
	const assets: Array<IndexEntry> = [];

	for (const e of entries) {
		if (e.shape === 'component') {
			if (e.tier === 'primitive') {
				primitives.push(e);
			} else {
				primary.push(e);
			}
		} else if (e.shape === 'barrel') {
			barrels.push(e);
		} else if (e.shape === 'asset') {
			assets.push(e);
		}
	}

	lines.push('## Components');
	lines.push('');
	for (const e of primary) {
		lines.push(formatLink(e));
	}
	lines.push('');

	if (barrels.length > 0) {
		lines.push('## Foundations');
		lines.push('');
		for (const e of barrels) {
			lines.push(formatLink(e));
		}
		lines.push('');
	}

	if (includeLibraryAuthors && primitives.length > 0) {
		lines.push('## Library authors');
		lines.push('');
		for (const e of primitives) {
			lines.push(formatLink(e));
		}
		lines.push('');
	}

	if (assets.length > 0) {
		lines.push('## Assets');
		lines.push('');
		for (const e of assets) {
			const note = ASSET_NOTES[e.path] ?? '';
			const path = e.path.startsWith('./') ? e.path.slice(2) : e.path;
			lines.push(`- \`${path}\` — ${note}`);
		}
		lines.push('');
	}

	return lines.join('\n');
}

function formatLink(e: IndexEntry): string {
	const desc = e.description ? `: ${e.description}` : '';
	const title = slugToTitle(e.slug, e.tier);
	const href = e.href ?? `./${e.slug}.md`;
	return `- [${title}](${href})${desc}`;
}
