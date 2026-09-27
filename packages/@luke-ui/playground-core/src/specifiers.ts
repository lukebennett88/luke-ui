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
	 * The host's active conditions, such as `['import']` for an ESM loader or
	 * `['browser', 'import']` for a bundler targeting the browser. `'default'`
	 * is always active and does not need to be listed.
	 * @default ['import']
	 */
	conditions?: ReadonlyArray<string>;
	/**
	 * Whether a resolved string target is a file the playground can load at
	 * runtime. Defaults to accepting `.js`, `.mjs`, and `.cjs`.
	 */
	isRunnableTarget?: (target: string) => boolean;
};

const DEFAULT_CONDITIONS = ['import'] as const;
const RUNNABLE_TARGET_PATTERN = /\.(?:c|m)?js$/;
const IMPORT_SPECIFIER_PATTERN = /\bfrom\s+["']([^"']+)["']/g;
const SIDE_EFFECT_IMPORT_PATTERN = /^import\s+["']([^"']+)["']/gm;

function defaultIsRunnableTarget(target: string): boolean {
	return RUNNABLE_TARGET_PATTERN.test(target);
}

/**
 * Import specifiers for a package's JavaScript subpath exports, sorted. `.`
 * maps to the package name and `./button` maps to `<packageName>/button`.
 *
 * A subpath is kept only when its target resolves to a string that
 * `isRunnableTarget` accepts. A string target is used as written.
 *
 * A conditions object is walked in the object's own key order, matching
 * Node's `PACKAGE_TARGET_RESOLVE` algorithm: for each key that is active (in
 * `options.conditions`, or `'default'`), resolve its value. An explicit
 * `null` target resolves to `null` and stops the search there, excluding the
 * subpath. Anything else that fails to resolve, such as a nested conditions
 * object with no active key, continues the loop to the next key. The order
 * of `options.conditions` itself does not matter, only the object's own key
 * order does.
 *
 * `./package.json`, array fallbacks, and `*` subpath patterns are skipped.
 * This is intentionally out of scope: the playground needs a single concrete
 * specifier per subpath, not a general `exports` resolver that can enumerate
 * patterns or fall back across an array. An array target is treated as no
 * match, so a later sibling condition can still apply.
 */
export function packageExportSpecifiers(
	packageName: string,
	exportsMap: PackageExportsMap,
	options?: PackageExportSpecifierOptions,
): Array<string> {
	const conditions = new Set(options?.conditions ?? DEFAULT_CONDITIONS);
	const isRunnableTarget = options?.isRunnableTarget ?? defaultIsRunnableTarget;
	return Object.entries(exportsMap)
		.flatMap(([subpath, target]) => {
			if (subpath === './package.json' || subpath.includes('*')) return [];
			const resolved = resolveExportTarget(target, conditions);
			if (resolved === null || resolved === undefined || !isRunnableTarget(resolved)) return [];
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

/**
 * Resolves one export target to a string, following Node's
 * `PACKAGE_TARGET_RESOLVE`. Returns `null` when an explicit `null` target is
 * reached, which stops resolution outright. Returns `undefined` when the
 * target does not resolve for another reason (no active key in a nested
 * conditions object, or an array, which this function does not expand), so
 * the caller's loop over sibling keys can continue.
 */
function resolveExportTarget(
	target: PackageExportTarget | undefined,
	conditions: ReadonlySet<string>,
): string | null | undefined {
	if (typeof target === 'string') return target;
	if (target === null) return null;
	// Arrays are out of scope (see packageExportSpecifiers' JSDoc): treated as
	// no match, not as a stop, so a later sibling condition can still apply.
	if (target === undefined || isTargetArray(target)) return undefined;

	for (const [condition, conditionTarget] of Object.entries(target)) {
		if (condition !== 'default' && !conditions.has(condition)) continue;
		const resolved = resolveExportTarget(conditionTarget, conditions);
		if (resolved !== undefined) return resolved;
	}
	return undefined;
}

function isTargetArray(target: PackageExportTarget): target is ReadonlyArray<PackageExportTarget> {
	return Array.isArray(target);
}
