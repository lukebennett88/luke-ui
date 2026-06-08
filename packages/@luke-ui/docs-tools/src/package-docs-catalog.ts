import { existsSync } from 'node:fs';
import type {
	DiscoveredExport,
	ExportPageKind,
	ExportShape,
	ExportTier,
} from '@luke-ui/docs-tools/discover-exports';
import { discoverExports } from '@luke-ui/docs-tools/discover-exports';
import type { ParsedBarrel, ParsedComponent } from '@luke-ui/docs-tools/parse-types';
import { parseBarrel, parseComponent } from '@luke-ui/docs-tools/parse-types';
import { slugToTitle } from '@luke-ui/docs-tools/title';

interface PackageDocsCatalogEntryBase {
	path: string;
	target: string;
	slug: string;
	shape: ExportShape;
	pageKind: ExportPageKind;
	tier: ExportTier;
	title: string;
	description: string;
}

export interface PackageDocsAssetEntry extends PackageDocsCatalogEntryBase {
	shape: 'asset';
	pageKind: 'asset';
	tier: 'n/a';
}

export interface PackageDocsComponentEntry extends PackageDocsCatalogEntryBase {
	pageKind: 'component';
	sourcePath: string;
	parsed: ParsedComponent;
}

export interface PackageDocsBarrelEntry extends PackageDocsCatalogEntryBase {
	pageKind: 'barrel';
	sourcePath: string;
	parsed: ParsedBarrel;
}

export type PackageDocsCatalogEntry =
	| PackageDocsAssetEntry
	| PackageDocsComponentEntry
	| PackageDocsBarrelEntry;

export type PackageDocsCatalogMetadata = Pick<
	PackageDocsCatalogEntry,
	'path' | 'target' | 'slug' | 'shape' | 'pageKind' | 'tier' | 'title' | 'description'
>;

export interface ResolvePackageDocsCatalogOptions {
	exportsField: Record<string, string>;
	packageRoot: string;
}

export function resolvePackageDocsCatalog(
	options: ResolvePackageDocsCatalogOptions,
): Array<PackageDocsCatalogEntry> {
	const discovered = discoverExports(options.exportsField, {
		packageRoot: options.packageRoot,
	});

	return discovered.map(resolveEntry);
}

function resolveEntry(entry: DiscoveredExport): PackageDocsCatalogEntry {
	if (entry.pageKind === 'asset') {
		return {
			path: entry.path,
			target: entry.target,
			slug: entry.slug,
			shape: 'asset',
			pageKind: 'asset',
			tier: 'n/a',
			title: slugToTitle(entry.slug, entry.tier),
			description: '',
		};
	}

	if (!entry.sourcePath || !existsSync(entry.sourcePath)) {
		throw new Error(
			`Could not resolve source for package export "${entry.path}" targeting "${entry.target}".`,
		);
	}

	if (entry.pageKind === 'barrel') {
		const parsed = parseBarrel(entry.sourcePath);
		return {
			...entry,
			pageKind: 'barrel',
			sourcePath: entry.sourcePath,
			title: slugToTitle(entry.slug, entry.tier),
			description: parsed.description,
			parsed,
		};
	}

	const parsed = parseComponent(entry.sourcePath);
	const tier = parsed.tier ?? entry.tier;
	return {
		...entry,
		pageKind: 'component',
		sourcePath: entry.sourcePath,
		tier,
		title: slugToTitle(entry.slug, tier),
		description: parsed.description,
		parsed,
	};
}
