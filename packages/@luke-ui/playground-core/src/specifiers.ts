/**
 * Specifiers the compiler itself needs at runtime: React, the DOM renderer, and
 * the automatic JSX runtime that compiled code imports.
 */
export const PLAYGROUND_BASE_SPECIFIERS = [
	'react',
	'react-dom',
	'react-dom/client',
	'react/jsx-runtime',
] as const;

/** A target in a `package.json` `exports` map: a path, or conditions that lead to one. */
export type PackageExportTarget =
	| string
	| null
	| ReadonlyArray<PackageExportTarget>
	| { readonly [condition: string]: PackageExportTarget };

/** A `package.json` `exports` map keyed by subpath, such as `.` or `./button`. */
export type PackageExportsMap = { readonly [subpath: string]: PackageExportTarget };

export type PackageExportSpecifierOptions = {
	/**
	 * Conditions to follow in a conditional target, in priority order. The
	 * first condition the target declares wins, and nested condition objects
	 * resolve the same way.
	 * @default ['import', 'default']
	 */
	conditions?: ReadonlyArray<string>;
};

const DEFAULT_CONDITIONS = ['import', 'default'] as const;
const IMPORT_SPECIFIER_PATTERN = /\bfrom\s+["']([^"']+)["']/g;
const SIDE_EFFECT_IMPORT_PATTERN = /^import\s+["']([^"']+)["']/gm;

/**
 * Import specifiers for a package's JavaScript subpath exports, sorted. `.`
 * maps to the package name and `./button` maps to `<packageName>/button`.
 *
 * A subpath is kept only when its target resolves to a `.js` file. A string
 * target is used as written. A condition object follows `options.conditions`.
 * `./package.json`, `null` targets, fallback arrays, and `*` patterns are
 * skipped, because the playground cannot enumerate or load them.
 */
export function packageExportSpecifiers(
	packageName: string,
	exportsMap: PackageExportsMap,
	options?: PackageExportSpecifierOptions,
): Array<string> {
	const conditions = options?.conditions ?? DEFAULT_CONDITIONS;
	return Object.entries(exportsMap)
		.flatMap(([subpath, target]) => {
			if (subpath === './package.json' || subpath.includes('*')) return [];
			const resolved = resolveExportTarget(target, conditions);
			if (resolved === null || !resolved.endsWith('.js')) return [];
			return [subpath === '.' ? packageName : `${packageName}/${subpath.slice(2)}`];
		})
		.sort();
}

export function importSpecifiersFromSource(source: string): Array<string> {
	const specifiers: Array<string> = [];

	for (const match of source.matchAll(IMPORT_SPECIFIER_PATTERN)) {
		const specifier = match[1];
		if (specifier !== undefined) specifiers.push(specifier);
	}

	for (const match of source.matchAll(SIDE_EFFECT_IMPORT_PATTERN)) {
		const specifier = match[1];
		if (specifier !== undefined) specifiers.push(specifier);
	}

	return specifiers;
}

export function canRunInPlayground(source: string, specifiers: ReadonlySet<string>): boolean {
	return importSpecifiersFromSource(source).every((specifier) => specifiers.has(specifier));
}

function resolveExportTarget(
	target: PackageExportTarget | undefined,
	conditions: ReadonlyArray<string>,
): string | null {
	if (typeof target === 'string') return target;
	if (target === null || target === undefined || isTargetArray(target)) return null;
	for (const condition of conditions) {
		if (condition in target) return resolveExportTarget(target[condition], conditions);
	}
	return null;
}

function isTargetArray(target: PackageExportTarget): target is ReadonlyArray<PackageExportTarget> {
	return Array.isArray(target);
}
