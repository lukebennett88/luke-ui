import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type ExportShape = 'component' | 'barrel' | 'asset';
export type ExportPageKind = 'component' | 'barrel' | 'asset';
export type ExportTier = 'atom' | 'composed' | 'primitive' | 'n/a';

export interface DiscoveredExport {
	/** The export specifier from package.json#exports, e.g. './button'. */
	path: string;
	/** The dist target path (right-hand side of #exports). */
	target: string;
	/** The slug used for the generated .md filename, e.g. 'button' or 'button-primitive'. */
	slug: string;
	shape: ExportShape;
	pageKind: ExportPageKind;
	tier: ExportTier;
	/** Absolute path to the source `index.tsx` for components/barrels; undefined for assets. */
	sourcePath?: string;
}

export interface DiscoverExportsOptions {
	packageRoot?: string;
	/**
	 * Export specifiers to classify as `barrel` (multi-export foundations).
	 * Defaults to {@link DEFAULT_BARREL_PATHS}, which is coupled to `@luke-ui/react`.
	 */
	barrelPaths?: Iterable<string>;
	/**
	 * Export specifiers to classify as `asset` (no docs page).
	 * Defaults to {@link DEFAULT_ASSET_PATHS}, which is coupled to `@luke-ui/react`.
	 */
	assetPaths?: Iterable<string>;
}

/**
 * Default barrel paths, coupled to `@luke-ui/react`'s public API.
 * Other consumers of `discoverExports` should pass their own via {@link DiscoverExportsOptions.barrelPaths}.
 */
export const DEFAULT_BARREL_PATHS: ReadonlyArray<string> = [
	'./heading-context',
	'./icon-size-context',
	'./recipes',
	'./theme',
	'./tokens',
	'./utils',
];

/**
 * Default asset paths, coupled to `@luke-ui/react`'s public API.
 * Other consumers of `discoverExports` should pass their own via {@link DiscoverExportsOptions.assetPaths}.
 */
export const DEFAULT_ASSET_PATHS: ReadonlyArray<string> = [
	'./stylesheet.css',
	'./spritesheet.svg',
	'./package.json',
];

const LEADING_DOT_SLASH = /^\.\//;
const SLASH = /\//g;
const FILE_EXTENSION = /\.[^.]+$/;

export function discoverExports(
	exportsField: Record<string, string>,
	options: DiscoverExportsOptions = {},
): Array<DiscoveredExport> {
	const barrelPaths = new Set(options.barrelPaths ?? DEFAULT_BARREL_PATHS);
	const assetPaths = new Set(options.assetPaths ?? DEFAULT_ASSET_PATHS);
	const result: Array<DiscoveredExport> = [];
	for (const [path, target] of Object.entries(exportsField)) {
		let shape: ExportShape;
		let tier: ExportTier;
		if (assetPaths.has(path)) {
			shape = 'asset';
			tier = 'n/a';
		} else if (barrelPaths.has(path)) {
			shape = 'barrel';
			tier = 'n/a';
		} else {
			shape = 'component';
			tier = path.endsWith('/primitive') ? 'primitive' : 'composed';
		}
		const sourcePath =
			shape === 'asset' ? undefined : sourceFromExport(options.packageRoot, target);
		const pageKind = pageKindFor({ shape, tier, sourcePath });
		const slug = path
			.replace(LEADING_DOT_SLASH, '')
			.replace(SLASH, '-')
			.replace(FILE_EXTENSION, '');
		result.push({ path, target, slug, shape, pageKind, tier, sourcePath });
	}
	return result;
}

function pageKindFor(input: {
	shape: ExportShape;
	tier: ExportTier;
	sourcePath: string | undefined;
}): ExportPageKind {
	if (input.shape !== 'component') return input.shape;
	if (input.tier !== 'primitive' || !input.sourcePath) return 'component';

	return countRuntimeExports(input.sourcePath) > 1 ? 'barrel' : 'component';
}

function sourceFromExport(root: string | undefined, distTarget: string): string | undefined {
	if (!root) return;

	const distRel = distTarget.replace(/^\.\/dist\//, '').replace(/\/index\.js$/, '');
	const tsxPath = join(root, 'src', distRel, 'index.tsx');
	const tsPath = join(root, 'src', distRel, 'index.ts');
	return existsSync(tsxPath) ? tsxPath : tsPath;
}

function countRuntimeExports(sourcePath: string): number {
	const source = readFileSync(sourcePath, 'utf8');
	const names = new Set<string>();

	for (const match of source.matchAll(
		/^export\s+(?:async\s+)?(?:function|class|const|let|var|enum)\s+([A-Za-z_$][\w$]*)/gm,
	)) {
		const name = match[1];
		if (name) names.add(name);
	}

	for (const match of source.matchAll(/^export\s*\{([^}]+)\}(?:\s+from\s+['"][^'"]+['"])?/gm)) {
		for (const specifier of (match[1] ?? '').split(',')) {
			const name = specifier.trim();
			if (!name || name.startsWith('type ')) continue;
			names.add(name);
		}
	}

	return names.size;
}
