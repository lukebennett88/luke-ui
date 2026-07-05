import type { PackageDocsCatalogMetadata } from './package-docs-catalog.js';
import { tierBucket } from './package-docs-catalog.js';

export interface IndexEntry extends PackageDocsCatalogMetadata {
	href?: string;
}

export interface RenderIndexInput {
	entries: Array<IndexEntry>;
	includeLibraryAuthors: boolean;
	packageName: string;
}

const ASSET_NOTES: Record<string, string> = {
	'./package.json': 'package manifest export, used by tooling — no docs.',
	'./spritesheet.svg':
		'sprite sheet referenced by the `Icon` atom; bundlers resolve this automatically.',
	'./stylesheet.css': "required side-effect import: `import '@luke-ui/react/stylesheet.css'`",
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
		switch (tierBucket(e)) {
			case 'primitive':
				primitives.push(e);
				break;
			case 'barrel':
				barrels.push(e);
				break;
			case 'asset':
				assets.push(e);
				break;
			default:
				primary.push(e);
				break;
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
	const href = e.href ?? `./${e.slug}.md`;
	return `- [${e.title}](${href})${desc}`;
}
