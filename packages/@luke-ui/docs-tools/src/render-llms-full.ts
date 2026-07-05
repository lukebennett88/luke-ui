import type { PackageDocsCatalogMetadata } from './package-docs-catalog.js';
import { tierBucket } from './package-docs-catalog.js';

export interface LlmsFullEntry extends Pick<PackageDocsCatalogMetadata, 'slug' | 'shape' | 'tier'> {
	md: string;
}

/**
 * Aggregates per-export markdown into a single `llms-full.md`-style document.
 *
 * Entries are sorted into a stable semantic order so that the aggregated output is
 * independent of `package.json#exports` insertion order:
 *
 *   1. atoms (alphabetical by slug)
 *   2. composed (alphabetical by slug)
 *   3. barrels (alphabetical by slug)
 *   4. primitives (alphabetical by slug)
 *
 * Entries that don't fall into one of those buckets (e.g. assets) are skipped.
 */
export function renderLlmsFull(entries: Array<LlmsFullEntry>): string {
	const header =
		'# Luke UI — full documentation\n\n> Concatenated per-export documentation for AI consumption.\n';
	const ordered = sortLlmsFullEntries(entries);
	const contents = ordered.map((entry) => entry.md);
	return [header, ...contents].join('\n\n---\n\n');
}

/**
 * Returns a new array of entries sorted into the canonical llms-full order:
 * atoms → composed → barrels → primitives, each group alphabetical by slug.
 * Entries that don't classify into a bucket are dropped.
 */
export function sortLlmsFullEntries<T extends LlmsFullEntry>(entries: Array<T>): Array<T> {
	const buckets: Record<string, Array<T>> = {};
	for (const entry of entries) {
		if (entry.shape !== 'component' && entry.shape !== 'barrel') continue;
		if (entry.shape === 'component' && !entry.tier) continue;

		const bucket = tierBucket(entry);
		(buckets[bucket] ??= []).push(entry);
	}
	const bySlug = (a: T, b: T) => a.slug.localeCompare(b.slug);
	return [
		...(buckets.atom ?? []).sort(bySlug),
		...(buckets.composed ?? []).sort(bySlug),
		...(buckets.barrel ?? []).sort(bySlug),
		...(buckets.primitive ?? []).sort(bySlug),
	];
}
