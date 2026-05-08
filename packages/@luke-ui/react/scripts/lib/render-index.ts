import type { DiscoveredExport } from './discover-exports.js';

export interface IndexEntry extends DiscoveredExport {
	description?: string;
}

export interface RenderIndexInput {
	packageName: string;
	pitch?: string;
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
	if (input.pitch) {
		lines.push(`> ${input.pitch}`);
		lines.push('');
	}

	const primary = entries.filter((e) => e.shape === 'component' && e.tier !== 'primitive');
	const primitives = entries.filter((e) => e.shape === 'component' && e.tier === 'primitive');
	const barrels = entries.filter((e) => e.shape === 'barrel');
	const assets = entries.filter((e) => e.shape === 'asset');

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
			lines.push(`- \`${e.path.replace(/^\.\//, '')}\` — ${note}`);
		}
		lines.push('');
	}

	return lines.join('\n');
}

function formatLink(e: IndexEntry): string {
	const desc = e.description ? `: ${e.description}` : '';
	const title = slugToTitle(e.slug, e.tier);
	return `- [${title}](./${e.slug}.md)${desc}`;
}

function slugToTitle(slug: string, tier: string): string {
	const isPrimitive = slug.endsWith('-primitive');
	const base = (isPrimitive ? slug.slice(0, -'-primitive'.length) : slug)
		.split('-')
		.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
		.join(' ');
	return tier === 'primitive' ? `${base} (primitive)` : base;
}
