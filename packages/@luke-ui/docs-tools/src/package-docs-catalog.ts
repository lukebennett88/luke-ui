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
	description: string;
	pageKind: ExportPageKind;
	path: string;
	shape: ExportShape;
	slug: string;
	target: string;
	tier: ExportTier;
	title: string;
}

export interface PackageDocsAssetEntry extends PackageDocsCatalogEntryBase {
	pageKind: 'asset';
	shape: 'asset';
	tier: 'n/a';
}

export interface PackageDocsComponentEntry extends PackageDocsCatalogEntryBase {
	pageKind: 'component';
	parsed: ParsedComponent;
	sourcePath: string;
}

export interface PackageDocsBarrelEntry extends PackageDocsCatalogEntryBase {
	pageKind: 'barrel';
	parsed: ParsedBarrel;
	sourcePath: string;
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
			description: '',
			pageKind: 'asset',
			path: entry.path,
			shape: 'asset',
			slug: entry.slug,
			target: entry.target,
			tier: 'n/a',
			title: slugToTitle(entry.slug, entry.tier),
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
			description: parsed.description,
			pageKind: 'barrel',
			parsed,
			sourcePath: entry.sourcePath,
			title: slugToTitle(entry.slug, entry.tier),
		};
	}

	const parsed = parseComponent(entry.sourcePath);
	const tier = parsed.tier ?? entry.tier;
	return {
		...entry,
		description: parsed.description,
		pageKind: 'component',
		parsed,
		sourcePath: entry.sourcePath,
		tier,
		title: slugToTitle(entry.slug, tier),
	};
}
