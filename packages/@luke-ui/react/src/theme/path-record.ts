/**
 * Typed `[path, value]` records for contract value producers. `Object.fromEntries` widens keys to
 * `string`; this module is the one place that restores `{ [P in K]: string }` from the pair keys.
 * Callers annotate the destination so a missing contract path is a type error, not a runtime gap.
 */

/** A `[path, value]` pair that keeps the path's literal type. */
export function pathEntry<K extends string>(path: K, value: string): readonly [K, string] {
	return [path, value];
}

/** Builds a complete path-keyed record from {@link pathEntry} pairs. */
export function pathRecord<K extends string>(
	entries: Iterable<readonly [K, string]>,
): { [P in K]: string } {
	return Object.fromEntries(entries) as { [P in K]: string };
}
