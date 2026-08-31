import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GuidePropAuditEntry, GuidePropAuditType } from './guide-prop-audit-data.js';

/** Relative guide paths excluded from the main component guide audit. */
const EXCLUDED_GUIDE_NAMES = new Set(['index.mdx', 'props.mdx']);

/** Discovers every main component guide under `docsComponentsDir`. */
export function discoverComponentGuides(docsComponentsDir: string): Array<string> {
	const guides: Array<string> = [];

	function walk(dir: string, prefix = ''): void {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (EXCLUDED_GUIDE_NAMES.has(entry.name)) continue;
			const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
			if (entry.isDirectory()) {
				walk(join(dir, entry.name), relative);
				continue;
			}
			if (!entry.name.endsWith('.mdx')) continue;
			guides.push(relative);
		}
	}

	walk(docsComponentsDir);
	return guides.sort();
}

/** Parses `<component-props-table>` tags from a guide's MDX source. */
function parseComponentPropsTables(
	content: string,
): Array<Pick<GuidePropAuditType, 'name' | 'path'>> {
	const tables: Array<Pick<GuidePropAuditType, 'name' | 'path'>> = [];
	const tagPattern = /<component-props-table\b[^>]*\/?>/g;

	for (const match of content.matchAll(tagPattern)) {
		const tag = match[0];
		const path = tag.match(/\bpath="([^"]+)"/)?.[1];
		const name = tag.match(/\bname="([^"]+)"/)?.[1];
		if (path === undefined || name === undefined) {
			throw new Error(`Malformed component-props-table tag: ${tag}`);
		}
		tables.push({ name, path });
	}

	return tables;
}

/** Reads the authored API tables for one guide. */
export function readGuideComponentPropsTables(
	docsComponentsDir: string,
	guide: string,
): Array<Pick<GuidePropAuditType, 'name' | 'path'>> {
	const content = readFileSync(join(docsComponentsDir, guide), 'utf8');
	return parseComponentPropsTables(content);
}

function typeKey(type: Pick<GuidePropAuditType, 'name' | 'path'>): string {
	return `${type.path}::${type.name}`;
}

/** Flattens audited types with their guide for prop visibility checks. */
export function flattenAuditedTypes(
	audit: ReadonlyArray<GuidePropAuditEntry>,
): ReadonlyArray<GuidePropAuditType & { guide: string }> {
	return audit.flatMap((entry) =>
		entry.types.map((type) => ({
			guide: entry.guide,
			...type,
		})),
	);
}

/** Compares discovered guides with curated audit entries. */
export function findGuideCoverageMismatches(
	discoveredGuides: ReadonlyArray<string>,
	audit: ReadonlyArray<GuidePropAuditEntry>,
): {
	duplicateAuditGuides: Array<string>;
	missingAuditGuides: Array<string>;
	staleAuditGuides: Array<string>;
} {
	const discovered = new Set(discoveredGuides);
	const auditGuides = audit.map((entry) => entry.guide);
	const auditGuideSet = new Set(auditGuides);

	const duplicateAuditGuides = auditGuides.filter(
		(guide, index) => auditGuides.indexOf(guide) !== index,
	);
	const missingAuditGuides = discoveredGuides.filter((guide) => !auditGuideSet.has(guide));
	const staleAuditGuides = auditGuides.filter((guide) => !discovered.has(guide));

	return { duplicateAuditGuides, missingAuditGuides, staleAuditGuides };
}

/** Compares authored API tables with curated audit metadata for one guide. */
export function findGuideTableMismatches(
	guide: string,
	authoredTables: ReadonlyArray<Pick<GuidePropAuditType, 'name' | 'path'>>,
	auditedTypes: ReadonlyArray<GuidePropAuditType>,
): {
	missingAuditedTables: Array<string>;
	staleAuditedTables: Array<string>;
} {
	const authoredKeys = new Set(authoredTables.map(typeKey));
	const auditedKeys = new Set(auditedTypes.map(typeKey));

	const missingAuditedTables = [...authoredKeys]
		.filter((key) => !auditedKeys.has(key))
		.map((key) => `${guide} → ${key}`);
	const staleAuditedTables = [...auditedKeys]
		.filter((key) => !authoredKeys.has(key))
		.map((key) => `${guide} → ${key}`);

	return { missingAuditedTables, staleAuditedTables };
}
