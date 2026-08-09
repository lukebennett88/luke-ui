import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vite-plus/test';
import { componentTestManifest } from './manifest.js';

const sourceRoot = resolve(import.meta.dirname, '..');

test('lists each public component entrypoint exactly once', () => {
	const paths = componentTestManifest.map((entry) => entry.path);

	expect(new Set(paths).size).toBe(paths.length);
	for (const path of paths) {
		expect(existsSync(resolve(sourceRoot, path, 'index.tsx'))).toBe(true);
	}
});

test('declares every conformance dimension explicitly', () => {
	for (const entry of componentTestManifest) {
		expect(entry.conformanceTier).toBeTypeOf('string');
		expect(entry.integrationTripwire).toBeTypeOf('string');
		expect(entry.visualApplicability).toBeTypeOf('string');
	}
});
