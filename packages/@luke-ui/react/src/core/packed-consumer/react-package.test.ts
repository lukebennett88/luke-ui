import { lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { transform } from 'lightningcss';
import { chromium } from 'playwright';
import { describe, expect, inject, test } from 'vite-plus/test';
import { cascadeLayerOrder } from '../styles/layer-names.js';
import type { Manifest } from './environment.js';
import {
	MINIMUM_TYPESCRIPT,
	builtAssets,
	importedPackages,
	installedVersion,
	measureBundle,
	npm,
	packageContentProblems,
	readManifest,
	repoRoot,
	run,
	scopeRoot,
	serveBuild,
	themeGenerationIn,
	tryRun,
} from './environment.js';
import { boundaryEntry, bundleBoundaries } from './react-fixture.js';

const { consumers, react, registrySpec } = inject('packedConsumer');

const WORKSPACE_PROTOCOL_PATTERN = /^(?:catalog|file|link|portal|workspace):/;
const ASSET_EXPORT_PATTERN = /\.(?:css|svg)$/;
const CUSTOM_PROPERTY_PATTERN = /--luke-[a-z-]+:/;
const SYMBOL_PATTERN = /<symbol\b[^>]*\bid="/;
/** Every cascade layer the shared stylesheet uses, in precedence order. */
const LAYER_ORDER = ['base', 'luke-ui', 'luke-ui.reset', 'luke-ui.recipes', 'luke-ui.utilities'];
const MODULE_SCRIPT_PATTERN = /<script type="module"[^>]+src="\/assets\/[^"]+\.js"/;
/**
 * Styling authoring: the Vanilla Extract authoring API, and the Luke UI and Rainbow authoring
 * modules.
 */
const STYLING_AUTHORING_PACKAGES = ['@vanilla-extract/css'];
const STYLING_AUTHORING_SOURCE_PATTERN =
	/^@luke-ui\/(?:react\/src\/core\/styles\/recipe\.ts|rainbow-sprinkles\/.*\/define-(?:properties|sprinkles)\.[jt]s)$/;
const LUKE_SOURCE_PATTERN = /^@luke-ui\/react\/src\//;

describe('the packed @luke-ui/react', () => {
	test('contains only published files and every export target', () => {
		expect(packageContentProblems(react)).toEqual({ missingTargets: [], unpublished: [] });
	});

	test('declares only installable dependency ranges', () => {
		const { manifest } = react;
		const ranges = { ...manifest.dependencies, ...manifest.peerDependencies };

		expect(
			Object.entries(ranges).filter(([, range]) => WORKSPACE_PROTOCOL_PATTERN.test(range)),
		).toEqual([]);
		expect(
			Object.entries(manifest.dependencies ?? {}).filter(
				([name, range]) => name.startsWith('@luke-ui/') && !isReleasable(name, range),
			),
		).toEqual([]);
	});

	test('imports exactly the packages it declares from its exports', () => {
		const { manifest } = react;
		const declared = [
			...Object.keys(manifest.dependencies ?? {}),
			...Object.keys(manifest.peerDependencies),
		].sort();
		const imported = [...importedPackages(react)].sort();

		expect({ undeclared: imported.filter((name) => !declared.includes(name)) }).toEqual({
			undeclared: [],
		});
		// React Aria Components renders through React DOM, so the peer keeps the application's copy.
		const peersWithoutImports = ['react-dom'];
		expect({
			unused: declared.filter(
				(name) => !imported.includes(name) && !peersWithoutImports.includes(name),
			),
		}).toEqual({ unused: [] });
	});
});

for (const consumer of consumers) {
	describe(`consumer with ${consumer.label}`, () => {
		const { dir, peers } = consumer;

		test('installs the package without workspace links', () => {
			expect(path.relative(repoRoot, dir).startsWith('..')).toBe(true);

			const scopeDir = path.join(dir, 'node_modules', '@luke-ui');
			for (const name of readdirSync(scopeDir)) {
				const installed = path.join(scopeDir, name);
				expect({ name, symlink: lstatSync(installed).isSymbolicLink() }).toEqual({
					name,
					symlink: false,
				});
				expect(realpathSync(installed).startsWith(realpathSync(dir))).toBe(true);
			}

			expect(installedVersion(dir, '@luke-ui/react')).toBe(react.manifest.version);
		});

		test.runIf(consumer.isLowest)('installs the lowest version each peer range allows', () => {
			const installed = Object.fromEntries(
				Object.keys(peers).map((name) => [name, installedVersion(dir, name)]),
			);
			expect(installed).toEqual(peers);
		});

		// Luke UI layers over React and React Aria, so what it alone adds to an install stays smaller
		// than its peers. A large data or tooling package in `dependencies` breaks that.
		test('adds less to an install than its peers do', () => {
			const peerSelector = Object.keys(peers)
				.flatMap((name) => [`#${name}`, `#${name} *`])
				.join(', ');
			const peerLocations = new Set(queryLocations(dir, peerSelector));
			const ownLocations = new Set(
				queryLocations(dir, '#@luke-ui/react, #@luke-ui/react *').filter(
					(location) => !peerLocations.has(location),
				),
			);
			const ownSizes = sizesOf(dir, ownLocations);
			const largest = [...ownSizes]
				.sort(([, a], [, b]) => b - a)
				.slice(0, 5)
				.map(([location]) => location);

			expect(totalSize(ownSizes), `Largest own packages: ${largest.join(', ')}`).toBeLessThan(
				totalSize(sizesOf(dir, peerLocations)),
			);
		});

		test('resolves one copy of each peer dependency', () => {
			const selector = Object.keys(peers)
				.map((name) => `#${name}`)
				.join(', ');
			const nodes = JSON.parse(npm(['query', selector], dir)) as Array<{
				location: string;
				name: string;
			}>;
			const locations: Record<string, Array<string>> = {};
			for (const node of nodes) (locations[node.name] ??= []).push(node.location);

			expect(locations).toEqual(
				Object.fromEntries(
					Object.keys(peers).map((name) => [name, [`node_modules/${name}`]] as const),
				),
			);
		});

		test(
			'renders on the server and hydrates in Chromium without errors',
			{ timeout: 120_000 },
			async () => {
				const markup = run('node', ['render.mjs'], dir);
				expect(markup).toContain('<blockquote');
				expect(markup).toContain('Hello world');
				expect(markup).toContain('<svg');
				expect(markup).toContain('<button');
				expect(markup).toContain('<input');
				expect(markup).toContain('role="switch"');

				const server = await serveBuild(dir);
				const browser = await chromium.launch();
				try {
					const page = await browser.newPage();
					const consoleErrors: Array<string> = [];
					page.on('console', (message) => {
						if (message.type() === 'error') consoleErrors.push(message.text());
					});
					page.on('pageerror', (error) => consoleErrors.push(String(error)));

					await page.goto(`${server.url}ssr.html`);
					await page.waitForFunction(
						() => (window as Window & HydrationGlobals).hydration !== undefined,
					);
					const result = await page.evaluate(() => {
						const { hydration, serverSnapshot } = window as Window & HydrationGlobals;
						const root = document.getElementById('root');
						const elements = [...(root?.querySelectorAll('*') ?? [])];
						const serverElements = serverSnapshot?.elements ?? [];
						return {
							controls: {
								buttons: root?.querySelectorAll('button').length,
								inputs: root?.querySelectorAll('input').length,
							},
							inputLabels: [...(root?.querySelectorAll('input') ?? [])].map(
								(input) => input.labels?.[0]?.textContent ?? null,
							),
							keptServerElements:
								elements.length === serverElements.length &&
								elements.every((element, index) => element === serverElements[index]),
							recoverableErrors: hydration?.recoverableErrors,
							textAfterHydration: root?.textContent,
							serverText: serverSnapshot?.text,
						};
					});

					expect(result.recoverableErrors).toEqual([]);
					expect(consoleErrors).toEqual([]);
					expect(result.controls).toEqual({ buttons: 1, inputs: 3 });
					// React Aria effects adjust attributes after hydration, so compare nodes, not markup.
					// Every server element must survive in place: none replaced, added, or removed.
					expect(result.keptServerElements).toBe(true);
					expect(result.textAfterHydration).toBe(result.serverText);
					// Each label resolves through server-generated ids, so it proves those ids hydrated intact.
					expect(result.inputLabels).toEqual(['Name', 'Example checkbox', 'Example switch']);

					// Clicking the label text proves hydration attached each field's handlers.
					await page.getByText('Example checkbox').click();
					expect(await page.getByRole('checkbox', { name: 'Example checkbox' }).isChecked()).toBe(
						true,
					);
					await page.getByText('Example switch').click();
					expect(await page.getByRole('switch', { name: 'Example switch' }).isChecked()).toBe(true);
				} finally {
					await browser.close();
					await server.close();
				}
			},
		);

		test('resolves CSS and SVG assets through package exports', () => {
			const require = createRequire(path.join(dir, 'package.json'));
			const assetExports = Object.keys(react.manifest.exports).filter((subpath) =>
				ASSET_EXPORT_PATTERN.test(subpath),
			);
			expect(assetExports).toEqual(
				expect.arrayContaining(['./stylesheet.css', './spritesheet.svg']),
			);

			const assets = assetExports.map((subpath) => {
				const resolved = realpathSync(require.resolve(`@luke-ui/react/${subpath.slice(2)}`));
				return {
					installed: resolved.startsWith(realpathSync(dir)),
					subpath,
					valid: isValidAsset(subpath, readFileSync(resolved, 'utf8')),
				};
			});
			expect(assets.filter((asset) => !asset.installed || !asset.valid)).toEqual([]);
		});

		test('builds a client bundle with Vite', () => {
			const assets = builtAssets(dir);
			const css = assets.read('.css');
			// Minifiers may rewrite the leading `@layer` statements when first appearance gives the same
			// order, so compare the order the layers take effect in.
			expect(layerOrder(css)).toEqual(LAYER_ORDER);
			expect(css).toMatch(CUSTOM_PROPERTY_PATTERN);

			const spritesheet = assets.names.find((name) => name.endsWith('.svg'));
			expect(spritesheet).toBeDefined();
			expect(assets.read('.svg')).toMatch(SYMBOL_PATTERN);
			// The spritesheet must ship as a URL. `<use>` does not support `data:` URLs consistently.
			expect(assets.read('.js')).toContain(spritesheet);

			const html = readFileSync(path.join(dir, 'dist', 'index.html'), 'utf8');
			expect(html).toMatch(MODULE_SCRIPT_PATTERN);
		});

		test(
			`type-checks every public entrypoint with ${consumer.isLowest ? `TypeScript ${MINIMUM_TYPESCRIPT}` : 'the workspace TypeScript'}`,
			{ timeout: 120_000 },
			() => {
				expect(installedVersion(dir, 'typescript')).toBe(consumer.typescript);

				for (const resolution of ['bundler', 'nodenext']) {
					const tsc = path.join('node_modules', '.bin', 'tsc');
					expect({
						resolution,
						output: tryRun(tsc, ['-p', `tsconfig.${resolution}.json`], dir),
					}).toEqual({ resolution, output: '' });
				}
			},
		);

		for (const boundary of bundleBoundaries) {
			test(`keeps a ${boundary.exportName} import to its own code`, { timeout: 60_000 }, () => {
				const bundle = measureBundle(dir, boundaryEntry(boundary));
				const related = new Set([boundary.entry, ...boundary.composes]);
				const unrelatedComponents = componentFiles(react.manifest).filter(
					([entry, file]) => !related.has(entry) && bundle.sources.includes(file),
				);

				// Without Luke UI source paths, the source maps did not resolve and nothing below is checked.
				expect(bundle.sources.some((source) => LUKE_SOURCE_PATTERN.test(source))).toBe(true);
				expect({
					stylingAuthoring: [
						...bundle.packages.filter((name) => STYLING_AUTHORING_PACKAGES.includes(name)),
						...bundle.sources.filter((source) => STYLING_AUTHORING_SOURCE_PATTERN.test(source)),
					],
					themeGeneration: themeGenerationIn(bundle, consumer),
					unrelatedComponents: unrelatedComponents.map(([, file]) => file),
				}).toEqual({ stylingAuthoring: [], themeGeneration: [], unrelatedComponents: [] });
			});
		}
	});
}

/**
 * Whether a `@luke-ui/*` dependency can be released at the range React declares. A packed run checks
 * that the sibling workspace package is not private and has exactly that version. A registry run
 * checks that a published version satisfies the range.
 */
function isReleasable(name: string, range: string): boolean {
	if (registrySpec === undefined) {
		const workspaceManifest = readManifest(
			path.join(scopeRoot, name.slice('@luke-ui/'.length), 'package.json'),
		);
		return workspaceManifest.private !== true && workspaceManifest.version === range;
	}
	try {
		return npm(['view', `${name}@${range}`, 'version'], tmpdir()).trim() !== '';
	} catch {
		return false;
	}
}

/** Whether an asset export holds what its path promises. */
function isValidAsset(subpath: string, source: string): boolean {
	if (subpath === './stylesheet.css') return source.startsWith(cascadeLayerOrder);
	return SYMBOL_PATTERN.test(source);
}

/** Each JS entrypoint paired with the source file its component would live in. */
function componentFiles(manifest: Manifest): Array<[entry: string, file: string]> {
	return Object.entries(manifest.exports).flatMap(([subpath, target]) => {
		if (!target.endsWith('.js')) return [];
		const entry = subpath.slice(2);
		return [[entry, `${manifest.name}/src/core/${entry}/${path.posix.basename(entry)}.tsx`]];
	});
}

function queryLocations(consumerDir: string, selector: string): Array<string> {
	return (JSON.parse(npm(['query', selector], consumerDir)) as Array<{ location: string }>).map(
		(node) => node.location,
	);
}

function sizesOf(consumerDir: string, locations: Iterable<string>): Map<string, number> {
	const sizes = new Map<string, number>();
	for (const location of locations) {
		sizes.set(location, directorySize(path.join(consumerDir, location)));
	}
	return sizes;
}

function totalSize(sizes: Map<string, number>): number {
	let total = 0;
	for (const size of sizes.values()) total += size;
	return total;
}

function directorySize(directory: string): number {
	let total = 0;
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) total += directorySize(entryPath);
		else if (entry.isFile()) total += lstatSync(entryPath).size;
	}
	return total;
}

/** A Lightning CSS rule, reduced to the fields the layer walk reads. */
interface LayerWalkRule {
	type: string;
	value: { name?: Array<string>; names?: Array<Array<string>>; rules?: Array<LayerWalkRule> };
}

/**
 * Cascade layers by full name, in the order the stylesheet first creates them, which is their
 * precedence order among siblings.
 */
function layerOrder(css: string): Array<string> {
	const order: Array<string> = [];
	function add(parent: Array<string>, name: Array<string>) {
		const fullName = [...parent, ...name].join('.');
		if (!order.includes(fullName)) order.push(fullName);
	}
	function walk(rules: Array<LayerWalkRule>, parent: Array<string>) {
		for (const rule of rules) {
			if (rule.type === 'layer-statement') {
				for (const name of rule.value.names ?? []) add(parent, name);
				continue;
			}
			const nested = rule.value.rules ?? [];
			if (rule.type === 'layer-block' && rule.value.name) {
				add(parent, rule.value.name);
				walk(nested, [...parent, ...rule.value.name]);
				continue;
			}
			if (rule.type === 'media' || rule.type === 'supports' || rule.type === 'container') {
				walk(nested, parent);
			}
		}
	}
	transform({
		code: Buffer.from(css),
		filename: 'consumer.css',
		visitor: {
			StyleSheetExit(sheet) {
				walk(structuredClone(sheet).rules as Array<LayerWalkRule>, []);
			},
		},
	});
	return order;
}

/** Globals the consumer page sets: the server DOM snapshot, then the hydration result. */
interface HydrationGlobals {
	hydration?: { recoverableErrors: Array<string> };
	serverSnapshot?: { elements: Array<Element>; text: string | null };
}
