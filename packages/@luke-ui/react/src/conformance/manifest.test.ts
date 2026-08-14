import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vite-plus/test';
import { componentTestManifest, getComponentTestManifestEntry } from './manifest.js';
import type { ComponentTestManifestEntry } from './manifest.js';

const sourceRoot = resolve(import.meta.dirname, '..');
const packageRoot = resolve(sourceRoot, '..');

// Public subpaths that are not normal component entrypoints, so they are exempt from the
// conformance manifest. `theme` is deliberately absent from this set: it has its own manifest
// entry (conformance tier `none`), so it must keep flowing through the normal check below. Keep
// this list explicit and named rather than deriving it from the manifest itself, so a public
// component entrypoint missing from the manifest fails this test instead of being silently
// skipped.
const NON_COMPONENT_EXPORTS = new Set(['styles', 'themes/paper', 'themes/tactile', 'utils']);

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
	for (const exportPath of Object.keys(packageJson.exports)) {
		if (!exportPath.startsWith('./') || exportPath.includes('*')) continue;
		const sourcePath = exportPath.slice(2);
		if (NON_COMPONENT_EXPORTS.has(sourcePath)) continue;
		if (existsSync(resolve(sourceRoot, sourcePath, 'index.ts'))) {
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

test('looks up a manifest entry by path', () => {
	const button = componentTestManifest.find((entry) => entry.path === 'button');
	expect(button).toBeDefined();
	expect(getComponentTestManifestEntry('button')).toBe(button);
	expect(() => getComponentTestManifestEntry('not-a-component')).toThrow(
		'Unknown component test path: not-a-component',
	);
});

test('enforces every manifest dimension', () => {
	for (const entry of componentTestManifest) {
		const browserTestPath = componentTestFile(entry, 'browser.test.tsx');
		const visualTestPath = componentTestFile(entry, 'visual.test.tsx');
		const needsBrowserCoverage =
			entry.conformanceTier !== 'none' || entry.integrationTripwire === 'required';

		if (needsBrowserCoverage) {
			expect(existsSync(browserTestPath)).toBe(true);
		}

		if (existsSync(browserTestPath)) {
			const source = readFileSync(browserTestPath, 'utf8');
			expect(source.includes('testUniversalConformance')).toBe(
				entry.conformanceTier === 'universal',
			);
			expect(source.includes('testFieldShapedConformance')).toBe(
				entry.conformanceTier === 'field-shaped',
			);
			expect(source.includes('testIntegration')).toBe(entry.integrationTripwire === 'required');
		}

		expect(existsSync(visualTestPath)).toBe(entry.visualApplicability === 'applicable');
	}
});

function componentTestFile(
	entry: ComponentTestManifestEntry,
	suffix: 'browser.test.tsx' | 'visual.test.tsx',
) {
	const basename = entry.path.split('/').at(-1);
	if (basename == null) throw new Error(`Invalid component test path: ${entry.path}`);
	return resolve(sourceRoot, entry.path, `${basename}.${suffix}`);
}
