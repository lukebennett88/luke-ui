import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vite-plus/test';
import { componentTestManifest } from './manifest.js';

const sourceRoot = resolve(import.meta.dirname, '..');
const packageRoot = resolve(sourceRoot, '..');

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function getExportPaths() {
	const packageJson: unknown = JSON.parse(
		readFileSync(resolve(packageRoot, 'package.json'), 'utf8'),
	);
	if (!isRecord(packageJson) || !isRecord(packageJson.exports)) {
		throw new Error('Expected package.json to define an exports object.');
	}

	const paths: Array<string> = [];
	const componentPaths = new Set(componentTestManifest.map((entry) => entry.path));
	for (const exportPath of Object.keys(packageJson.exports)) {
		if (!exportPath.startsWith('./') || exportPath.includes('*')) continue;
		const sourcePath = exportPath.slice(2);
		if (componentPaths.has(sourcePath) && existsSync(resolve(sourceRoot, sourcePath, 'index.ts'))) {
			paths.push(sourcePath);
		}
	}

	return paths.sort();
}

test('covers every public component entrypoint exactly once', () => {
	const paths = componentTestManifest.map((entry) => entry.path);

	expect(new Set(paths).size).toBe(paths.length);
	expect([...paths].sort()).toEqual(getExportPaths());
	for (const path of paths) {
		expect(existsSync(resolve(sourceRoot, path, 'index.ts'))).toBe(true);
	}
});

test('declares every conformance dimension explicitly', () => {
	for (const entry of componentTestManifest) {
		expect(entry.conformanceTier).toBeTypeOf('string');
		expect(entry.integrationTripwire).toBeTypeOf('string');
		expect(entry.visualApplicability).toBeTypeOf('string');
	}
});
