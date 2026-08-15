import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vite-plus/test';
import type { ComponentTestManifestEntry } from './manifest.js';
import { componentTestManifest } from './manifest.js';

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

function componentFile(path: string, suffix: 'browser.test.tsx' | 'visual.test.tsx') {
	const basename = path.split('/').at(-1);
	if (basename == null) throw new Error(`Invalid component test path: ${path}`);
	return resolve(sourceRoot, path, `${basename}.${suffix}`);
}

function hasHelperCall(source: string, helperName: string, path: string): boolean {
	const uncommented = source.replaceAll(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
	const escapedPath = path.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
	if (helperName === 'testIntegration') {
		return new RegExp(
			String.raw`(?:^|\n)\s*testIntegration\s*\(\s*(['"])${escapedPath}\1\s*,`,
		).test(uncommented);
	}
	return new RegExp(
		String.raw`(?:^|\n)\s*${helperName}\s*\(\s*\{\s*path\s*:\s*(['"])${escapedPath}\1`,
	).test(uncommented);
}

function getBrowserCoverageErrors(
	manifest: ReadonlyArray<ComponentTestManifestEntry>,
	readBrowserSource: (path: string) => string,
) {
	const errors: Array<string> = [];
	for (const entry of manifest) {
		if (entry.conformanceTier === 'none' && entry.integrationTripwire === 'none') continue;
		const source = readBrowserSource(entry.path);
		if (
			entry.conformanceTier !== 'none' &&
			!hasHelperCall(
				source,
				entry.conformanceTier === 'universal'
					? 'testUniversalConformance'
					: 'testFieldShapedConformance',
				entry.path,
			)
		) {
			errors.push(`${entry.path} must invoke its ${entry.conformanceTier} conformance helper.`);
		}
		if (
			entry.integrationTripwire === 'required' &&
			!hasHelperCall(source, 'testIntegration', entry.path)
		) {
			errors.push(`${entry.path} must invoke its integration tripwire.`);
		}
	}
	return errors;
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

test('browser tests invoke the helpers required by their manifest entry', () => {
	expect(
		getBrowserCoverageErrors(componentTestManifest, (path) => {
			return readFileSync(componentFile(path, 'browser.test.tsx'), 'utf8');
		}),
	).toEqual([]);
});

test('visual fixtures match their manifest entries', () => {
	for (const entry of componentTestManifest) {
		expect(existsSync(componentFile(entry.path, 'visual.test.tsx'))).toBe(
			entry.visualApplicability === 'applicable',
		);
	}
});

test('rejects helper calls for another manifest path and source lookalikes', () => {
	const [button] = componentTestManifest.filter((entry) => entry.path === 'button');
	if (button == null) throw new Error('Expected the Button manifest entry.');

	const wrongPathSource = `
		// testUniversalConformance({ path: 'button' });
		const description = "testIntegration('button', async () => {})";
		testUniversalConformance({ path: 'link' });
		testIntegration('link', async () => {});
	`;
	expect(getBrowserCoverageErrors([button], () => wrongPathSource)).toEqual([
		'button must invoke its universal conformance helper.',
		'button must invoke its integration tripwire.',
	]);
});

test('accepts conformance calls with nested callbacks', () => {
	const [button] = componentTestManifest.filter((entry) => entry.path === 'button');
	if (button == null) throw new Error('Expected the Button manifest entry.');

	const source = `
		testUniversalConformance({
			path: 'button',
			render: () => {
				return <Button />;
			},
		});
		testIntegration('button', async () => {});
	`;
	expect(getBrowserCoverageErrors([button], () => source)).toEqual([]);
});
