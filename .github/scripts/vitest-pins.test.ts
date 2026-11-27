import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

/** Maps each `vitest` and `@vitest/*` package in the lockfile to the versions it resolves to. */
function vitestVersions(lockfile: string) {
	const versions = new Map<string, Set<string>>();
	for (const match of lockfile.matchAll(/^ {2}'?(vitest|@vitest\/[^@']+)@(\d[^'(:]*)/gm)) {
		const [, name, version] = match;
		if (!name || !version) continue;
		const seen = versions.get(name) ?? new Set();
		seen.add(version);
		versions.set(name, seen);
	}
	return versions;
}

test('vitest and @vitest/* resolve to one version each', async () => {
	const lockfile = await readFile(`${repoRoot}/pnpm-lock.yaml`, 'utf8');
	const versions = vitestVersions(lockfile);
	expect(versions.get('vitest')?.size).toBe(1);

	// vite-plus pins vitest and @vitest/* at exact versions. A catalog entry ahead of those pins
	// installs a second copy, and browser matchers then reject locators made by the other copy. Set
	// the catalog's vitest and @vitest/* entries to the versions vite-plus declares.
	const duplicated = [...versions]
		.filter(([, seen]) => seen.size > 1)
		.map(([name, seen]) => `${name}: ${[...seen].join(', ')}`);
	expect(duplicated).toEqual([]);
});

test('the duplicate check reports a second @vitest/browser copy', () => {
	const lockfile = [
		"  '@vitest/browser@5.1.0':",
		"  '@vitest/browser@5.1.1(vitest@5.1.1)':",
		'  vitest@5.1.1:',
	].join('\n');

	expect(vitestVersions(lockfile)).toEqual(
		new Map([
			['@vitest/browser', new Set(['5.1.0', '5.1.1'])],
			['vitest', new Set(['5.1.1'])],
		]),
	);
});
