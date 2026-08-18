import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Node } from 'oxc-parser';
import { parseSync } from 'oxc-parser';
import { expect, test } from 'vite-plus/test';
import type { ComponentTestManifestEntry } from './manifest.js';
import { componentTestManifest } from './manifest.js';

const sourceRoot = resolve(import.meta.dirname, '..');
const packageRoot = resolve(sourceRoot, '..');

// Public subpaths that are not normal component entrypoints, so they are exempt from the
// conformance manifest. `theme` is deliberately absent from this set: it has its own manifest
// entry (empty conformance), so it must keep flowing through the normal check below. Keep
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
	const parsed = parseSync(`${path}.browser.test.tsx`, source, { lang: 'tsx' });
	if (parsed.errors.length > 0) {
		throw new Error(`Could not parse ${path}.browser.test.tsx: ${parsed.errors[0]?.message}`);
	}

	for (const statement of parsed.program.body) {
		if (statement.type !== 'ExpressionStatement') continue;
		const expression = statement.expression;
		if (expression.type !== 'CallExpression') continue;
		if (expression.callee.type !== 'Identifier' || expression.callee.name !== helperName) {
			continue;
		}
		if (helperPath(expression.arguments[0], helperName) === path) return true;
	}
	return false;
}

function helperPath(argument: Node | undefined, helperName: string): string | undefined {
	if (helperName === 'testIntegration') return stringLiteral(argument);
	if (argument?.type !== 'ObjectExpression') return undefined;

	for (const property of argument.properties) {
		if (property.type !== 'Property' || property.computed) continue;
		if (propertyName(property.key) !== 'path') continue;
		return stringLiteral(property.value);
	}
}

function propertyName(node: Node): string | undefined {
	if (node.type === 'Identifier') return node.name;
	return stringLiteral(node);
}

function stringLiteral(node: Node | undefined): string | undefined {
	if (node?.type === 'Literal' && typeof node.value === 'string') return node.value;
}

function isEnoent(error: unknown): boolean {
	return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function readOptionalBrowserSource(
	path: string,
	readBrowserSource: (path: string) => string,
): string | undefined {
	try {
		return readBrowserSource(path);
	} catch (error) {
		if (isEnoent(error)) return undefined;
		throw error;
	}
}

function getBrowserCoverageErrors(
	manifest: ReadonlyArray<ComponentTestManifestEntry>,
	readBrowserSource: (path: string) => string,
) {
	const errors: Array<string> = [];
	for (const entry of manifest) {
		if (entry.conformance.length === 0) {
			const source = readOptionalBrowserSource(entry.path, readBrowserSource);
			if (source !== undefined && hasHelperCall(source, 'testConformance', entry.path)) {
				errors.push(`${entry.path} invokes its conformance helper with no contracts.`);
			}
		}

		if (entry.conformance.length === 0 && entry.integrationTripwire === 'none') continue;

		const source = readBrowserSource(entry.path);
		if (entry.conformance.length > 0 && !hasHelperCall(source, 'testConformance', entry.path)) {
			errors.push(`${entry.path} must invoke its conformance helper.`);
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
		// testConformance({ path: 'button' });
		const description = "testIntegration('button', async () => {})";
		const fake = \`
			testConformance({ path: 'button' });
			testIntegration('button', async () => {});
		\`;
		testConformance({ path: 'link' });
		testIntegration('link', async () => {});
	`;
	expect(getBrowserCoverageErrors([button], () => wrongPathSource)).toEqual([
		'button must invoke its conformance helper.',
		'button must invoke its integration tripwire.',
	]);
});

test('rejects a conformance helper when the manifest entry has no contracts', () => {
	const [icon] = componentTestManifest.filter((entry) => entry.path === 'icon');
	if (icon == null) throw new Error('Expected the Icon manifest entry.');

	const source = `
		testConformance({ path: 'icon' });
	`;
	expect(getBrowserCoverageErrors([icon], () => source)).toEqual([
		'icon invokes its conformance helper with no contracts.',
	]);
});

test('accepts a missing browser test when the manifest entry has no contracts', () => {
	const [icon] = componentTestManifest.filter((entry) => entry.path === 'icon');
	if (icon == null) throw new Error('Expected the Icon manifest entry.');

	const missing: NodeJS.ErrnoException = new Error('ENOENT: no such file or directory');
	missing.code = 'ENOENT';

	expect(
		getBrowserCoverageErrors([icon], () => {
			throw missing;
		}),
	).toEqual([]);
});

test('does not swallow a non-ENOENT error when reading an empty-contract browser test', () => {
	const [icon] = componentTestManifest.filter((entry) => entry.path === 'icon');
	if (icon == null) throw new Error('Expected the Icon manifest entry.');

	const denied: NodeJS.ErrnoException = new Error('EACCES: permission denied');
	denied.code = 'EACCES';

	expect(() =>
		getBrowserCoverageErrors([icon], () => {
			throw denied;
		}),
	).toThrow(denied);
});

test('rejects a conformance helper with no contracts even when an integration tripwire is required', () => {
	const entry: ComponentTestManifestEntry = {
		conformance: [],
		integrationTripwire: 'required',
		name: 'Example',
		path: 'example',
		visualApplicability: 'none',
	};
	const source = `
		testConformance({ path: 'example' });
		testIntegration('example', async () => {});
	`;
	expect(getBrowserCoverageErrors([entry], () => source)).toEqual([
		'example invokes its conformance helper with no contracts.',
	]);
});

test('accepts a conformance helper when path is not the first property', () => {
	const [button] = componentTestManifest.filter((entry) => entry.path === 'button');
	if (button == null) throw new Error('Expected the Button manifest entry.');

	const source = `
		testConformance({
			render: () => render(<Button />),
			path: 'button',
			getTarget: (result) => result.locator.getByRole('button').element(),
		});
		testIntegration('button', async () => {});
	`;
	expect(getBrowserCoverageErrors([button], () => source)).toEqual([]);
});
