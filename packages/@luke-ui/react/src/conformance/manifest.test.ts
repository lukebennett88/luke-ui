import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Node } from 'oxc-parser';
import { parseSync, visitorKeys } from 'oxc-parser';
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

// Theme's token board exercises the theme contract. It is not component visual coverage.
const NON_COMPONENT_VISUAL_FIXTURES = new Set(['theme/token-board.visual.test.tsx']);

type CallExpressionNode = Extract<Node, { type: 'CallExpression' }>;

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

function findCallExpressions(sourcePath: string, source: string): Array<CallExpressionNode> {
	const parsed = parseSync(sourcePath, source, { lang: 'tsx' });
	if (parsed.errors.length > 0) {
		throw new Error(`Could not parse ${sourcePath}: ${parsed.errors[0]?.message}`);
	}

	const calls: Array<CallExpressionNode> = [];
	visit(parsed.program, (node) => {
		if (node.type === 'CallExpression') calls.push(node);
	});
	return calls;
}

function hasConformanceCall(
	calls: ReadonlyArray<CallExpressionNode>,
	helperName: string,
	path: string,
): boolean {
	return calls.some((call) => {
		if (!isCallTo(call, helperName)) return false;

		return objectPropertyStringValue(call.arguments[0], 'path') === path;
	});
}

function hasIntegrationCall(calls: ReadonlyArray<CallExpressionNode>, path: string): boolean {
	return calls.some(
		(call) => isCallTo(call, 'testIntegration') && stringValue(call.arguments[0]) === path,
	);
}

function hasVisualCapture(calls: ReadonlyArray<CallExpressionNode>, path: string): boolean {
	return calls.some((call) => {
		if (!isCallTo(call, 'captureVisual') && !isCallTo(call, 'captureVisualAppearance'))
			return false;

		return captureNameStartsWithPath(call.arguments[1], path);
	});
}

function isCallTo(node: Node, name: string): node is CallExpressionNode {
	return (
		node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === name
	);
}

function objectPropertyStringValue(
	node: Node | undefined,
	propertyName: string,
): string | undefined {
	if (node?.type !== 'ObjectExpression') return undefined;

	for (const property of node.properties) {
		if (property.type !== 'Property' || property.computed) continue;
		if (propertyNameFor(property.key) !== propertyName) continue;

		return stringValue(property.value);
	}
}

function propertyNameFor(node: Node): string | undefined {
	if (node.type === 'Identifier') return node.name;

	return stringValue(node);
}

function stringValue(node: Node | undefined): string | undefined {
	if (node?.type === 'Literal' && typeof node.value === 'string') return node.value;
	if (node?.type !== 'TemplateLiteral' || node.expressions.length > 0) return undefined;

	return node.quasis[0]?.value.cooked ?? undefined;
}

function captureNameStartsWithPath(node: Node | undefined, path: string): boolean {
	const prefix = `${path}/`;
	const captureName = stringValue(node);
	if (captureName != null) return captureName.startsWith(prefix);

	return (
		node?.type === 'TemplateLiteral' && (node.quasis[0]?.value.cooked?.startsWith(prefix) ?? false)
	);
}

function visit(node: Node, visitor: (node: Node) => void) {
	visitor(node);
	for (const key of visitorKeys[node.type] ?? []) {
		const child = Reflect.get(node, key);
		if (Array.isArray(child)) {
			for (const item of child) {
				if (isNode(item)) visit(item, visitor);
			}
		} else if (isNode(child)) {
			visit(child, visitor);
		}
	}
}

function isNode(value: unknown): value is Node {
	return (
		typeof value === 'object' && value !== null && typeof Reflect.get(value, 'type') === 'string'
	);
}

function getBrowserCoverageErrors(
	manifest: ReadonlyArray<ComponentTestManifestEntry>,
	readBrowserSource: (path: string) => string,
) {
	const errors: Array<string> = [];
	for (const entry of manifest) {
		if (entry.conformanceTier === 'none' && entry.integrationTripwire === 'none') continue;
		const calls = findCallExpressions(
			`${entry.path}.browser.test.tsx`,
			readBrowserSource(entry.path),
		);
		if (
			entry.conformanceTier !== 'none' &&
			!hasConformanceCall(
				calls,
				entry.conformanceTier === 'universal'
					? 'testUniversalConformance'
					: 'testFieldShapedConformance',
				entry.path,
			)
		) {
			errors.push(`${entry.path} must invoke its ${entry.conformanceTier} conformance helper.`);
		}
		if (entry.integrationTripwire === 'required' && !hasIntegrationCall(calls, entry.path)) {
			errors.push(`${entry.path} must invoke its integration tripwire.`);
		}
	}
	return errors;
}

function getVisualCoverageErrors(
	manifest: ReadonlyArray<ComponentTestManifestEntry>,
	readVisualSource: (path: string) => string | undefined,
) {
	const errors: Array<string> = [];
	for (const entry of manifest) {
		const source = readVisualSource(entry.path);
		if (entry.visualApplicability === 'none') {
			if (source != null) errors.push(`${entry.path} must not have a component visual fixture.`);
			continue;
		}
		if (source == null) {
			errors.push(`${entry.path} must have a component visual fixture.`);
			continue;
		}
		const calls = findCallExpressions(`${entry.path}.visual.test.tsx`, source);
		if (!hasVisualCapture(calls, entry.path)) {
			errors.push(`${entry.path} must capture its component visual fixture.`);
		}
	}
	return errors;
}

function getVisualFixturePath(path: string): string {
	const componentName = path.split('/').at(-1);
	if (componentName == null) throw new Error(`Invalid component visual path: ${path}`);

	return `${path}/${componentName}.visual.test.tsx`;
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
			const componentName = path.split('/').at(-1);
			if (componentName == null) throw new Error(`Invalid component test path: ${path}`);
			return readFileSync(resolve(sourceRoot, path, `${componentName}.browser.test.tsx`), 'utf8');
		}),
	).toEqual([]);
});

test('visual fixtures match their manifest entries', () => {
	expect(
		getVisualCoverageErrors(componentTestManifest, (path) => {
			const fixturePath = resolve(sourceRoot, getVisualFixturePath(path));
			if (!existsSync(fixturePath)) return undefined;

			return readFileSync(fixturePath, 'utf8');
		}),
	).toEqual([]);
});

test('keeps Theme token-board coverage separate from component coverage', () => {
	for (const fixturePath of NON_COMPONENT_VISUAL_FIXTURES) {
		expect(existsSync(resolve(sourceRoot, fixturePath))).toBe(true);
	}

	const [theme] = componentTestManifest.filter((entry) => entry.path === 'theme');
	if (theme == null) throw new Error('Expected the Theme manifest entry.');
	expect(getVisualCoverageErrors([theme], () => undefined)).toEqual([]);
});

test('rejects helper calls for another manifest path and source lookalikes', () => {
	const [button] = componentTestManifest.filter((entry) => entry.path === 'button');
	if (button == null) throw new Error('Expected the Button manifest entry.');

	const wrongPathSource = `
		// testUniversalConformance({ path: 'button' });
		const description = "testIntegration('button', 'Button')";
		testUniversalConformance({ path: 'link' });
		testIntegration('link', 'Button', async () => {});
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
		testIntegration('button', 'Button', async () => {});
	`;
	expect(getBrowserCoverageErrors([button], () => source)).toEqual([]);
});

test('rejects missing, mismatched, and non-call component visual coverage', () => {
	const [button, theme] = componentTestManifest.filter(
		(entry) => entry.path === 'button' || entry.path === 'theme',
	);
	if (button == null || theme == null)
		throw new Error('Expected the Button and Theme manifest entries.');

	expect(
		getVisualCoverageErrors(
			[button],
			() => `const capture = "captureVisual(locator, 'button/x')";`,
		),
	).toEqual(['button must capture its component visual fixture.']);
	expect(
		getVisualCoverageErrors([button], () => 'captureVisual(locator, `button/variant-${name}`);'),
	).toEqual([]);
	expect(
		getVisualCoverageErrors([button], () => `captureVisual(locator, 'link/kitchen-sink');`),
	).toEqual(['button must capture its component visual fixture.']);
	expect(getVisualCoverageErrors([button], () => undefined)).toEqual([
		'button must have a component visual fixture.',
	]);
	expect(
		getVisualCoverageErrors([theme], () => `captureVisual(locator, 'theme/component');`),
	).toEqual(['theme must not have a component visual fixture.']);
});
