import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseComponentFrontmatter, readFrontmatter } from './docs-frontmatter.js';

const EXPORTS_PREFIX = 'packages/@luke-ui/react/src/exports/';

/** One authored component guide, keyed by the slug the navigation uses. */
interface ComponentGuide {
	props: ReadonlyArray<{ name: string; path: string }>;
	relativePath: string;
	slug: string;
	source: string | undefined;
}

/**
 * The single scan the navigation and source checks share. `check:docs` builds it once, so no
 * check re-reads the guides or the root metadata.
 */
export interface ComponentGuideInventory {
	guides: ReadonlyArray<ComponentGuide>;
	metadataEntries: ReadonlyArray<string>;
	packageExports: ReadonlyArray<string>;
}

export interface ComponentGuideInventoryInput {
	componentsDir: string;
	guides: ReadonlyArray<{ group: string; relativePath: string; source: string }>;
	reactPackageJsonPath: string;
}

/** Reads the root metadata and the package manifest once, alongside the already-read guides. */
export function buildComponentGuideInventory(
	input: ComponentGuideInventoryInput,
): ComponentGuideInventory {
	const metadataEntries = readRootMetadata(input.componentsDir);

	return {
		guides: input.guides.map((guide) => {
			const frontmatter = parseComponentFrontmatter(guide.source);
			const name =
				guide.relativePath
					.replace(/\.mdx$/, '')
					.split('/')
					.at(-1) ?? '';
			return {
				relativePath: guide.relativePath,
				slug: `${guide.group}/${name}`,
				props: frontmatter.props,
				source: readFrontmatter(guide.source).source,
			};
		}),
		metadataEntries,
		packageExports: readPackageExports(input.reactPackageJsonPath),
	};
}

/** A guide missing from the root metadata, or a metadata entry with no guide. */
export function findGuideNavigationIssues(inventory: ComponentGuideInventory): Array<string> {
	const issues: Array<string> = [];
	const entrySet = new Set(inventory.metadataEntries);
	const slugSet = new Set(inventory.guides.map((guide) => guide.slug));

	for (const guide of inventory.guides) {
		if (entrySet.has(guide.slug)) continue;
		issues.push(
			`${guide.relativePath}: guide is absent from the root component metadata (expected entry "${guide.slug}")`,
		);
	}

	for (const entry of inventory.metadataEntries) {
		if (slugSet.has(entry)) continue;
		issues.push(`components/meta.json: entry "${entry}" has no guide (expected ${entry}.mdx)`);
	}

	return issues;
}

/** A slug listed more than once in the root metadata. */
export function findRepeatedMetadataIssues(inventory: ComponentGuideInventory): Array<string> {
	const seen = new Set<string>();
	const reported = new Set<string>();
	const issues: Array<string> = [];

	for (const entry of inventory.metadataEntries) {
		if (!seen.has(entry)) {
			seen.add(entry);
			continue;
		}
		if (reported.has(entry)) continue;
		reported.add(entry);
		issues.push(`components/meta.json: entry "${entry}" is repeated`);
	}

	return issues;
}

/**
 * Each category `meta.json` must list the `<name>` part of its root metadata slice, in the same
 * order, so the sidebar and the root navigation agree.
 */
export function findCategoryMetadataIssues(
	inventory: ComponentGuideInventory,
	componentsDir: string,
): Array<string> {
	const issues: Array<string> = [];
	const expectedByGroup = new Map<string, Array<string>>();

	for (const slug of inventory.metadataEntries) {
		const separator = slug.indexOf('/');
		if (separator === -1) continue;
		const group = slug.slice(0, separator);
		const pages = expectedByGroup.get(group) ?? [];
		pages.push(slug.slice(separator + 1));
		expectedByGroup.set(group, pages);
	}

	for (const guide of inventory.guides) {
		const group = guide.slug.split('/')[0];
		if (group === undefined) continue;
		if (!expectedByGroup.has(group)) expectedByGroup.set(group, []);
	}

	// Leftover <group>/meta.json files are otherwise invisible once the root
	// metadata and the guides no longer mention that category.
	for (const group of categoryDirectories(componentsDir)) {
		if (!expectedByGroup.has(group)) expectedByGroup.set(group, []);
	}

	for (const [group, expected] of expectedByGroup) {
		const metaPath = resolve(componentsDir, group, 'meta.json');

		if (!existsSync(metaPath)) {
			issues.push(
				`${group}/meta.json: missing category metadata (expected pages ${formatList(expected)})`,
			);
			continue;
		}

		const pages = readMetaPages(metaPath);
		if (!sameOrder(pages, expected)) {
			issues.push(
				`${group}/meta.json: pages ${formatList(pages)} do not match the root metadata (expected ${formatList(expected)})`,
			);
		}
	}

	return issues;
}

function categoryDirectories(componentsDir: string): Array<string> {
	if (!existsSync(componentsDir)) return [];

	return readdirSync(componentsDir, { withFileTypes: true }).flatMap((entry) => {
		if (!entry.isDirectory()) return [];
		if (!existsSync(resolve(componentsDir, entry.name, 'meta.json'))) return [];
		return [entry.name];
	});
}

/**
 * A guide `source` must name a public package entry point and its exports module, so a documented
 * component is one a developer can import.
 */
export function findGuideSourceIssues(
	inventory: ComponentGuideInventory,
	reactPackageDir: string,
): Array<string> {
	const issues: Array<string> = [];
	const exportSet = new Set(inventory.packageExports);

	for (const guide of inventory.guides) {
		const { relativePath, source } = guide;
		if (source === undefined) continue;

		if (!source.startsWith(EXPORTS_PREFIX)) {
			issues.push(
				`${relativePath}: source "${source}" is not a public package entry point (expected a path under ${EXPORTS_PREFIX})`,
			);
			continue;
		}

		const exportPath = source.slice(EXPORTS_PREFIX.length);
		if (!exportPath.endsWith('.ts')) {
			issues.push(`${relativePath}: source "${source}" must name an exports .ts module`);
			continue;
		}

		const subpath = exportPath.slice(0, -'.ts'.length);
		if (!exportSet.has(`./${subpath}`)) {
			issues.push(
				`${relativePath}: source "${source}" is not a public package entry point (expected export "./${subpath}" in @luke-ui/react)`,
			);
			continue;
		}

		const sourcePath = resolve(reactPackageDir, 'src', 'exports', exportPath);
		if (!existsSync(sourcePath)) {
			issues.push(`${relativePath}: source "${source}" does not exist`);
		}
	}

	return issues;
}

function readRootMetadata(componentsDir: string): Array<string> {
	const metadataEntries: Array<string> = [];
	const metaPath = resolve(componentsDir, 'meta.json');
	if (!existsSync(metaPath)) return metadataEntries;

	for (const page of readMetaPages(metaPath)) {
		if (page.startsWith('!') || !page.includes('/')) continue;

		metadataEntries.push(page);
	}

	return metadataEntries;
}

function readMetaPages(metaPath: string): Array<string> {
	const parsed: unknown = JSON.parse(readFileSync(metaPath, 'utf8'));
	if (typeof parsed !== 'object' || parsed === null) return [];
	const pages = (parsed as { pages?: unknown }).pages;
	if (!Array.isArray(pages)) return [];
	return pages.filter((page): page is string => typeof page === 'string');
}

function readPackageExports(packageJsonPath: string): Array<string> {
	if (!existsSync(packageJsonPath)) return [];
	const parsed: unknown = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
	if (typeof parsed !== 'object' || parsed === null) return [];
	const exports = (parsed as { exports?: unknown }).exports;
	if (typeof exports !== 'object' || exports === null) return [];
	return Object.keys(exports);
}

function sameOrder(actual: ReadonlyArray<string>, expected: ReadonlyArray<string>): boolean {
	return (
		actual.length === expected.length && actual.every((page, index) => page === expected[index])
	);
}

function formatList(pages: ReadonlyArray<string>): string {
	return `[${pages.join(', ')}]`;
}
