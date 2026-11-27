import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

/** Matches a lockfile key for `vitest` or `@vitest/*`, capturing the package name and version. */
const VITEST_LOCKFILE_KEY = /^ {2}'?(vitest|@vitest\/[^@']+)@(\d[^'(:]*)/gm;

test('vitest and @vitest/* resolve to one version each', async () => {
	const lockfile = await readFile(`${repoRoot}/pnpm-lock.yaml`, 'utf8');
	const versions = vitestVersions(lockfile);
	expect(versions.get('vitest')?.size).toBe(1);

	// vite-plus pins vitest and @vitest/* at exact versions. A catalog entry ahead of those pins
	// installs a second copy, and browser matchers then reject locators made by the other copy. Set
	// the catalog's vitest and @vitest/* entries to the versions vite-plus declares.
	expect(duplicatedPackages(versions)).toEqual([]);
});

/** Maps each `vitest` and `@vitest/*` package in the lockfile to the versions it resolves to. */
function vitestVersions(lockfile: string) {
	const versions = new Map<string, Set<string>>();
	for (const [, name, version] of lockfile.matchAll(VITEST_LOCKFILE_KEY)) {
		if (!name || !version) continue;
		const seen = versions.get(name) ?? new Set();
		seen.add(version);
		versions.set(name, seen);
	}
	return versions;
}

/** Lists each package with more than one version, as `name: version, version`. */
function duplicatedPackages(versions: Map<string, Set<string>>) {
	const duplicated: Array<string> = [];
	for (const [name, seen] of versions) {
		if (seen.size < 2) continue;
		duplicated.push(`${name}: ${[...seen].join(', ')}`);
	}
	return duplicated;
}
