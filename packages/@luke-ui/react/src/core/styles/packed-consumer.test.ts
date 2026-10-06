import { execFileSync } from 'node:child_process';
import { lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vite-plus/test';
import { cascadeLayerNames } from './layer-names.js';

/**
 * Packed-consumer harness for `@luke-ui/react`. It runs with `pnpm run test:consumer`, not with the
 * unit tests, because its npm installs need network access.
 *
 * By default it packs the workspace build and installs the tarballs with npm outside the repository.
 * Set `LUKE_UI_REACT_SPEC` to a version or dist-tag to test that published package instead. Each
 * install runs once with the newest peers the published ranges allow and once with the lowest.
 */

const registrySpec = process.env.LUKE_UI_REACT_SPEC?.trim() || undefined;

/**
 * The oldest TypeScript that accepts the published declarations. The Installation page states this
 * floor, so change both together.
 */
const MINIMUM_TYPESCRIPT = '5.8';

const packageRoot = fileURLToPath(new URL('../../..', import.meta.url));
const scopeRoot = fileURLToPath(new URL('../../../..', import.meta.url));
const repoRoot = fileURLToPath(new URL('../../../../../..', import.meta.url));
const workspaceRequire = createRequire(import.meta.url);
const workspaceTypeScript = readManifest(
	workspaceRequire.resolve('typescript/package.json'),
).version;
/**
 * The consumer builds with the Vite the workspace installs, pinned exactly. Bundler drift is not part
 * of the package contract.
 */
const workspaceVite = readManifest(workspaceRequire.resolve('vite/package.json'));
const VITE_SPEC =
	workspaceVite.name === 'vite'
		? workspaceVite.version
		: `npm:${workspaceVite.name}@${workspaceVite.version}`;

/** The only paths a tarball may contain. */
const PUBLISHED_PATH_PATTERN = /^(?:dist\/|skills\/|LICENSE$|README\.md$|package\.json$)/;
const WORKSPACE_PROTOCOL_PATTERN = /^(?:catalog|file|link|portal|workspace):/;
const ASSET_EXPORT_PATTERN = /\.(?:css|svg)$/;
const CUSTOM_PROPERTY_PATTERN = /--luke-[a-z-]+:/;
const SYMBOL_PATTERN = /<symbol\b[^>]*\bid="/;
/** The statement that fixes cascade layer order at the top of the shared stylesheet. */
const LAYER_STATEMENT = `@layer ${cascadeLayerNames.join(', ')};`;
const MODULE_SCRIPT_PATTERN = /<script type="module"[^>]+src="\/assets\/[^"]+\.js"/;
const SSR_OUTLET = '<!--ssr-outlet-->';

interface Manifest {
	dependencies?: Record<string, string>;
	exports: Record<string, string>;
	name: string;
	peerDependencies: Record<string, string>;
	private?: boolean;
	version: string;
}

interface Artifact {
	/** Package root extracted from the tarball. */
	contents: string;
	/** Tarball paths relative to `package/`. */
	files: Array<string>;
	/** Dependency specs that install the artifact, and any packed workspace dependencies. */
	installSpecs: Record<string, string>;
	manifest: Manifest;
}

let workDir = '';
let artifact: Artifact;

beforeAll(async () => {
	workDir = await mkdtemp(path.join(tmpdir(), 'luke-ui-consumer-'));
	artifact = registrySpec === undefined ? await packWorkspace() : await fetchFromRegistry();
}, 300_000);

afterAll(async () => {
	if (workDir !== '') await rm(workDir, { force: true, recursive: true });
}, 60_000);

describe('artifact', () => {
	test('contains only published files and every export target', () => {
		expect(artifact.files.filter((file) => !PUBLISHED_PATH_PATTERN.test(file))).toEqual([]);

		const missingTargets = Object.values(artifact.manifest.exports)
			.map((target) => target.slice(2))
			.filter((target) => !artifact.files.includes(target));
		expect(missingTargets).toEqual([]);
	});

	test('declares only installable dependency ranges', () => {
		const { manifest } = artifact;
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
		const { manifest } = artifact;
		const declared = [
			...Object.keys(manifest.dependencies ?? {}),
			...Object.keys(manifest.peerDependencies),
		].sort();
		const imported = [...importedPackages(artifact)].sort();

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

interface BundleBoundary {
	/**
	 * Public entrypoints whose components the import renders, apart from its own. Add one only when
	 * the component starts rendering it.
	 */
	composes: Array<string>;
	/** The public entrypoint under test. */
	entry: string;
	exportName: string;
}

/** Small runtime imports, each checked for what it bundles. */
const bundleBoundaries: Array<BundleBoundary> = [
	{ composes: ['text', 'visually-hidden'], entry: 'blockquote', exportName: 'Blockquote' },
	{
		composes: ['loading-spinner', 'primitives/button', 'text', 'visually-hidden'],
		entry: 'button',
		exportName: 'Button',
	},
	{ composes: [], entry: 'box', exportName: 'Box' },
	{ composes: [], entry: 'theme', exportName: 'vars' },
];

/**
 * Theme modules that runtime code shares with theme generation. Every other theme module a
 * `defineTheme` import bundles counts as theme generation.
 */
const RUNTIME_THEME_MODULES = ['@luke-ui/react/src/theme/type-styles.ts'];
const THEME_MODULE_PATTERN = /^@luke-ui\/react\/src\/theme\//;
/** Packages that only theme generation needs. */
const THEME_GENERATION_PACKAGE_PATTERN = /^@capsizecss\//;
/**
 * Styling authoring: the Vanilla Extract authoring API, and the Luke UI and Rainbow authoring
 * modules.
 */
const STYLING_AUTHORING_PACKAGES = ['@vanilla-extract/css'];
const STYLING_AUTHORING_SOURCE_PATTERN =
	/^@luke-ui\/(?:react\/src\/core\/styles\/recipe\.ts|rainbow-sprinkles\/.*\/define-(?:properties|sprinkles)\.[jt]s)$/;
const LUKE_SOURCE_PATTERN = /^@luke-ui\/react\/src\//;

interface PeerSet {
	/** Whether the set installs the lowest version of each range. */
	isLowest: boolean;
	label: string;
	/** Picks the version installed for a range. */
	resolve: (name: string, range: string) => string;
	slug: string;
	/** TypeScript range the set type-checks with. */
	typescriptRange: string;
}

const peerSets: Array<PeerSet> = [
	{
		isLowest: false,
		label: 'the newest peers',
		resolve: (_name, range) => range,
		slug: 'newest',
		typescriptRange: workspaceTypeScript,
	},
	{
		isLowest: true,
		label: `the lowest peers and TypeScript ${MINIMUM_TYPESCRIPT}`,
		resolve: lowestPublished,
		slug: 'lowest',
		typescriptRange: `~${MINIMUM_TYPESCRIPT}.0`,
	},
];

for (const peerSet of peerSets) {
	describe(`consumer with ${peerSet.label}`, () => {
		let consumerDir = '';
		let peers: Record<string, string> = {};
		let themeGeneration: Array<string> = [];
		let typescript = '';
		let isBuilt = false;

		/** Builds the client app and the server entry once, for the tests that need them. */
		function buildApp(): void {
			if (isBuilt) return;
			run('node', ['build-app.mjs'], consumerDir);
			isBuilt = true;
		}

		beforeAll(async () => {
			consumerDir = path.join(workDir, peerSet.slug);
			peers = Object.fromEntries(
				Object.entries(artifact.manifest.peerDependencies).map(([name, range]) => [
					name,
					peerSet.resolve(name, range),
				]),
			);
			typescript = peerSet.resolve('typescript', peerSet.typescriptRange);
			await installConsumer(consumerDir, peerSet, peers, typescript);
			themeGeneration = measureBundle(consumerDir, 'define-theme').sources.filter(
				(source) => THEME_MODULE_PATTERN.test(source) && !RUNTIME_THEME_MODULES.includes(source),
			);
		}, 600_000);

		test('installs the artifact without workspace links', () => {
			expect(path.relative(repoRoot, consumerDir).startsWith('..')).toBe(true);

			const scopeDir = path.join(consumerDir, 'node_modules', '@luke-ui');
			for (const name of readdirSync(scopeDir)) {
				const installed = path.join(scopeDir, name);
				expect({ name, symlink: lstatSync(installed).isSymbolicLink() }).toEqual({
					name,
					symlink: false,
				});
				expect(realpathSync(installed).startsWith(realpathSync(consumerDir))).toBe(true);
			}

			expect(installedVersion(consumerDir, '@luke-ui/react')).toBe(artifact.manifest.version);
		});

		test.runIf(peerSet.isLowest)('installs the lowest version each peer range allows', () => {
			const installed = Object.fromEntries(
				Object.keys(peers).map((name) => [name, installedVersion(consumerDir, name)]),
			);
			expect(installed).toEqual(peers);
		});

		// Luke UI layers over React and React Aria, so what it alone adds to an install stays smaller
		// than its peers. A large data or tooling package in `dependencies` breaks that.
		test('adds less to an install than its peers do', () => {
			const peerSelector = Object.keys(peers)
				.flatMap((name) => [`#${name}`, `#${name} *`])
				.join(', ');
			const peerLocations = new Set(queryLocations(consumerDir, peerSelector));
			const ownLocations = new Set(
				queryLocations(consumerDir, '#@luke-ui/react, #@luke-ui/react *').filter(
					(location) => !peerLocations.has(location),
				),
			);
			const ownSizes = sizesOf(consumerDir, ownLocations);
			const largest = [...ownSizes]
				.sort(([, a], [, b]) => b - a)
				.slice(0, 5)
				.map(([location]) => location);

			expect(totalSize(ownSizes), `Largest own packages: ${largest.join(', ')}`).toBeLessThan(
				totalSize(sizesOf(consumerDir, peerLocations)),
			);
		});

		test('resolves one copy of each peer dependency', () => {
			const selector = Object.keys(peers)
				.map((name) => `#${name}`)
				.join(', ');
			const nodes = JSON.parse(npm(['query', selector], consumerDir)) as Array<{
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
				buildApp();
				const markup = run('node', ['render.mjs'], consumerDir);
				expect(markup).toContain('<blockquote');
				expect(markup).toContain('Hello world');
				expect(markup).toContain('<svg');
				expect(markup).toContain('<button');
				expect(markup).toContain('<input');

				const server = await serveDirectory(path.join(consumerDir, 'dist'));
				const browser = await chromium.launch();
				try {
					const page = await browser.newPage();
					const consoleErrors: Array<string> = [];
					page.on('console', (message) => {
						if (message.type() === 'error') consoleErrors.push(message.text());
					});
					page.on('pageerror', (error) => consoleErrors.push(String(error)));

					await page.goto(server.url);
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
							inputLabel: root?.querySelector('input')?.labels?.[0]?.textContent ?? null,
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
					expect(result.controls).toEqual({ buttons: 1, inputs: 1 });
					// React Aria effects adjust attributes after hydration, so compare nodes, not markup.
					// Every server element must survive in place: none replaced, added, or removed.
					expect(result.keptServerElements).toBe(true);
					expect(result.textAfterHydration).toBe(result.serverText);
					// The label resolves through server-generated ids, so it proves those ids hydrated intact.
					expect(result.inputLabel).toBe('Name');
				} finally {
					await browser.close();
					await server.close();
				}
			},
		);

		test('resolves CSS and SVG assets through package exports', () => {
			const require = createRequire(path.join(consumerDir, 'package.json'));
			const assetExports = Object.keys(artifact.manifest.exports).filter((subpath) =>
				ASSET_EXPORT_PATTERN.test(subpath),
			);
			expect(assetExports).toEqual(
				expect.arrayContaining(['./stylesheet.css', './spritesheet.svg']),
			);

			const assets = assetExports.map((subpath) => {
				const resolved = realpathSync(require.resolve(`@luke-ui/react/${subpath.slice(2)}`));
				return {
					installed: resolved.startsWith(realpathSync(consumerDir)),
					subpath,
					valid: isValidAsset(subpath, readFileSync(resolved, 'utf8')),
				};
			});
			expect(assets.filter((asset) => !asset.installed || !asset.valid)).toEqual([]);
		});

		test('builds a client bundle with Vite', { timeout: 120_000 }, async () => {
			buildApp();

			const assetsDir = path.join(consumerDir, 'dist', 'assets');
			const assets = readdirSync(assetsDir);
			const read = (extension: string) =>
				assets
					.filter((name) => name.endsWith(extension))
					.map((name) => readFileSync(path.join(assetsDir, name), 'utf8'))
					.join('\n');

			const css = read('.css');
			// Minifiers may drop the leading `@layer` statement when first appearance gives the same
			// order, so compare the order the layers take effect in.
			expect(layerOrder(css)).toEqual(cascadeLayerNames);
			expect(css).toMatch(CUSTOM_PROPERTY_PATTERN);

			const spritesheet = assets.find((name) => name.endsWith('.svg'));
			expect(spritesheet).toBeDefined();
			expect(read('.svg')).toMatch(SYMBOL_PATTERN);
			// The spritesheet must ship as a URL. `<use>` does not support `data:` URLs consistently.
			expect(read('.js')).toContain(spritesheet);

			const html = await readFile(path.join(consumerDir, 'dist', 'index.html'), 'utf8');
			expect(html).toMatch(MODULE_SCRIPT_PATTERN);
		});

		test(
			`type-checks every public entrypoint with ${peerSet.isLowest ? `TypeScript ${MINIMUM_TYPESCRIPT}` : 'the workspace TypeScript'}`,
			{
				timeout: 120_000,
			},
			() => {
				expect(installedVersion(consumerDir, 'typescript')).toBe(typescript);

				for (const resolution of ['bundler', 'nodenext']) {
					const tsc = path.join('node_modules', '.bin', 'tsc');
					expect({
						resolution,
						output: tryRun(tsc, ['-p', `tsconfig.${resolution}.json`], consumerDir),
					}).toEqual({ resolution, output: '' });
				}
			},
		);

		for (const boundary of bundleBoundaries) {
			test(`keeps a ${boundary.exportName} import to its own code`, { timeout: 60_000 }, () => {
				const { packages, sources } = measureBundle(consumerDir, boundarySlug(boundary));
				const related = new Set([boundary.entry, ...boundary.composes]);
				const unrelatedComponents = componentFiles(artifact.manifest).filter(
					([entry, file]) => !related.has(entry) && sources.includes(file),
				);

				// Without Luke UI source paths, the source maps did not resolve and nothing below is checked.
				expect(sources.some((source) => LUKE_SOURCE_PATTERN.test(source))).toBe(true);
				expect({
					stylingAuthoring: [
						...packages.filter((name) => STYLING_AUTHORING_PACKAGES.includes(name)),
						...sources.filter((source) => STYLING_AUTHORING_SOURCE_PATTERN.test(source)),
					],
					themeGeneration: [
						...packages.filter((name) => THEME_GENERATION_PACKAGE_PATTERN.test(name)),
						...sources.filter((source) => themeGeneration.includes(source)),
					],
					unrelatedComponents: unrelatedComponents.map(([, file]) => file),
				}).toEqual({ stylingAuthoring: [], themeGeneration: [], unrelatedComponents: [] });
			});
		}
	});
}

async function packWorkspace(): Promise<Artifact> {
	const tarball = await pnpmPack(packageRoot, 'react');
	const contents = await extract(tarball, 'react');
	const manifest = readManifest(path.join(contents, 'package.json'));

	// npm cannot resolve an unreleased workspace dependency, so pack those beside React.
	const workspaceDependencies = await Promise.all(
		Object.keys(manifest.dependencies ?? {})
			.filter((name) => name.startsWith('@luke-ui/'))
			.map(async (name) => {
				const slug = name.slice('@luke-ui/'.length);
				return [name, `file:${await pnpmPack(path.join(scopeRoot, slug), slug)}`] as const;
			}),
	);
	const installSpecs = {
		[manifest.name]: `file:${tarball}`,
		...Object.fromEntries(workspaceDependencies),
	};

	return { contents, files: listFiles(contents), installSpecs, manifest };
}

async function fetchFromRegistry(): Promise<Artifact> {
	const spec = `@luke-ui/react@${registrySpec}`;
	const destination = path.join(workDir, 'pack');
	await mkdir(destination, { recursive: true });
	npm(['pack', spec, '--pack-destination', destination], workDir);
	const tarball = path.join(destination, onlyTarball(destination));
	const contents = await extract(tarball, 'react');
	const manifest = readManifest(path.join(contents, 'package.json'));

	return {
		contents,
		files: listFiles(contents),
		installSpecs: { [manifest.name]: spec },
		manifest,
	};
}

async function pnpmPack(cwd: string, slug: string): Promise<string> {
	const destination = path.join(workDir, 'pack', slug);
	await mkdir(destination, { recursive: true });
	run('pnpm', ['pack', '--pack-destination', destination], cwd, process.env);
	return path.join(destination, onlyTarball(destination));
}

function onlyTarball(directory: string): string {
	const tarballs = readdirSync(directory).filter((name) => name.endsWith('.tgz'));
	if (tarballs.length !== 1) {
		throw new Error(
			`Expected one tarball in ${directory}, found ${tarballs.join(', ') || 'none'}.`,
		);
	}
	return tarballs[0]!;
}

async function extract(tarball: string, slug: string): Promise<string> {
	const destination = path.join(workDir, 'extracted', slug);
	await mkdir(destination, { recursive: true });
	run('tar', ['-xzf', tarball, '-C', destination], workDir);
	return path.join(destination, 'package');
}

function listFiles(root: string, prefix = ''): Array<string> {
	return readdirSync(path.join(root, prefix), { withFileTypes: true }).flatMap((entry) => {
		const relative = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
		return entry.isDirectory() ? listFiles(root, relative) : [relative];
	});
}

/**
 * Whether a `@luke-ui/*` dependency can be released at the range React declares. A packed run checks
 * that the sibling workspace package is not private and has exactly that version. A registry run
 * checks that a published version satisfies the range.
 */
function isReleasable(name: string, range: string): boolean {
	if (registrySpec === undefined) {
		const workspaceManifest = readWorkspaceManifest(name);
		return workspaceManifest.private !== true && workspaceManifest.version === range;
	}
	try {
		return npm(['view', `${name}@${range}`, 'version'], workDir).trim() !== '';
	} catch {
		return false;
	}
}

/** Whether an asset export holds what its path promises. */
function isValidAsset(subpath: string, source: string): boolean {
	if (subpath === './stylesheet.css') return source.startsWith(LAYER_STATEMENT);
	if (subpath.endsWith('/stylesheet.css')) return CUSTOM_PROPERTY_PATTERN.test(source);
	return SYMBOL_PATTERN.test(source);
}

function readWorkspaceManifest(name: string): Manifest {
	return readManifest(path.join(scopeRoot, name.slice('@luke-ui/'.length), 'package.json'));
}

/** Specifiers in `from '…'`, side-effect `import '…'`, and `import('…')` forms. */
const MODULE_SPECIFIER_PATTERN =
	/(?:\bfrom\s*|\bimport\s*\(?\s*)["']((?:\.{1,2}\/|@[\w.-]+\/)?[\w.-]+(?:\/[\w.-]+)*)["']/g;
const BLOCK_COMMENT_PATTERN = /\/\*[\s\S]*?\*\//g;
const JS_EXTENSION_PATTERN = /\.js$/;

/** Every package imported by the JavaScript and declarations that the exports map reaches. */
function importedPackages({ contents, manifest }: Artifact): Set<string> {
	const queue = Object.values(manifest.exports)
		.filter((target) => target.endsWith('.js'))
		.flatMap((target) => [target.slice(2), `${target.slice(2, -3)}.d.ts`]);
	const visited = new Set<string>();
	const packages = new Set<string>();

	for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
		if (visited.has(file)) continue;
		visited.add(file);

		// JSDoc can mention `import('…')`, so comments are not graph edges.
		const source = readFileSync(path.join(contents, file), 'utf8').replaceAll(
			BLOCK_COMMENT_PATTERN,
			'',
		);
		for (const match of source.matchAll(MODULE_SPECIFIER_PATTERN)) {
			const specifier = match[1]!;
			if (specifier.startsWith('.')) {
				const resolved = path.posix.join(path.posix.dirname(file), specifier);
				queue.push(
					file.endsWith('.d.ts') ? resolved.replace(JS_EXTENSION_PATTERN, '.d.ts') : resolved,
				);
			} else if (!specifier.startsWith('node:')) {
				const segments = specifier.split('/');
				packages.add(specifier.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0]!);
			}
		}
	}
	return packages;
}

async function installConsumer(
	consumerDir: string,
	peerSet: PeerSet,
	peers: Record<string, string>,
	typescript: string,
): Promise<void> {
	await mkdir(path.join(consumerDir, 'entries'), { recursive: true });
	await mkdir(path.join(consumerDir, 'src'), { recursive: true });

	const reactRange = artifact.manifest.peerDependencies.react;
	if (reactRange === undefined) throw new Error('Expected a react peer range.');
	// The React types follow the React peer range, so the lowest set gets the lowest matching types.
	const reactTypes = peerSet.resolve('@types/react', reactRange);
	const reactDomTypes = peerSet.resolve('@types/react-dom', reactRange);

	const files: Record<string, string> = {
		'package.json': JSON.stringify(
			{
				name: `luke-ui-consumer-${peerSet.slug}`,
				private: true,
				type: 'module',
				dependencies: { ...artifact.installSpecs, ...peers },
				devDependencies: {
					'@types/react': reactTypes,
					'@types/react-dom': reactDomTypes,
					typescript,
					vite: VITE_SPEC,
				},
			},
			null,
			2,
		),
		'build-app.mjs': BUILD_APP,
		'index.html': CLIENT_HTML,
		'render.mjs': RENDER,
		'src/app.js': APP,
		'src/entry-client.js': ENTRY_CLIENT,
		'src/entry-server.js': ENTRY_SERVER,
		'measure-bundle.mjs': MEASURE_BUNDLE,
		'app.tsx': TYPED_APP,
		'all-entries.ts': allEntriesSource(artifact.manifest),
		'tsconfig.bundler.json': tsconfig('esnext', 'bundler'),
		'tsconfig.nodenext.json': tsconfig('nodenext', 'nodenext'),
	};
	for (const boundary of bundleBoundaries) {
		files[`entries/${boundarySlug(boundary)}.js`] =
			`export { ${boundary.exportName} } from '@luke-ui/react/${boundary.entry}';\n`;
	}
	files['entries/define-theme.js'] = `export { defineTheme } from '@luke-ui/react/theme';\n`;
	await Promise.all(
		Object.entries(files).map(([name, source]) => writeFile(path.join(consumerDir, name), source)),
	);

	npm(['install', '--no-audit', '--no-fund', '--ignore-scripts'], consumerDir);
}

function allEntriesSource(manifest: Manifest): string {
	const subpaths = Object.entries(manifest.exports)
		.filter(([, target]) => target.endsWith('.js'))
		.map(([subpath]) => subpath.slice(2));
	return [
		...subpaths.map(
			(subpath, index) => `import * as entry${index} from '${manifest.name}/${subpath}';`,
		),
		`export const entries = [${subpaths.map((_, index) => `entry${index}`).join(', ')}];`,
		'',
	].join('\n');
}

function tsconfig(module: string, moduleResolution: string): string {
	return JSON.stringify(
		{
			compilerOptions: {
				jsx: 'react-jsx',
				lib: ['es2022', 'dom', 'dom.iterable'],
				module,
				moduleResolution,
				noEmit: true,
				skipLibCheck: false,
				strict: true,
				target: 'es2022',
				types: [],
			},
			files: ['all-entries.ts', 'app.tsx'],
		},
		null,
		2,
	);
}

function boundarySlug({ entry, exportName }: BundleBoundary): string {
	return `${entry.replaceAll('/', '-')}-${exportName}`;
}

/** Each JS entrypoint paired with the source file its component would live in. */
function componentFiles(manifest: Manifest): Array<[entry: string, file: string]> {
	return Object.entries(manifest.exports).flatMap(([subpath, target]) => {
		if (!target.endsWith('.js')) return [];
		const entry = subpath.slice(2);
		return [[entry, `${manifest.name}/src/core/${entry}/${path.posix.basename(entry)}.tsx`]];
	});
}

/** Packages, and `@luke-ui/*` source files, that contribute code to a bundle of one entry. */
function measureBundle(
	consumerDir: string,
	slug: string,
): { packages: Array<string>; sources: Array<string> } {
	return JSON.parse(run('node', ['measure-bundle.mjs', `entries/${slug}.js`], consumerDir));
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

const LAYER_RULE_PATTERN = /@layer\s+([^{;]+)[{;]/g;

/** Cascade layers in the order a stylesheet first names them, which is their precedence order. */
function layerOrder(css: string): Array<string> {
	const order: Array<string> = [];
	for (const match of css.matchAll(LAYER_RULE_PATTERN)) {
		for (const name of match[1]!.split(',').map((part) => part.trim())) {
			if (!order.includes(name)) order.push(name);
		}
	}
	return order;
}

/** Lowest published version a range admits, so the lowest set never floats. */
function lowestPublished(name: string, range: string): string {
	const versions: unknown = JSON.parse(
		npm(['view', `${name}@${range}`, 'version', '--json'], workDir),
	);
	const lowest = Array.isArray(versions) ? versions[0] : versions;
	if (typeof lowest !== 'string') {
		throw new Error(`No published version of ${name} satisfies "${range}".`);
	}
	return lowest;
}

/** Globals the consumer page sets: the server DOM snapshot, then the hydration result. */
interface HydrationGlobals {
	hydration?: { recoverableErrors: Array<string> };
	serverSnapshot?: { elements: Array<Element>; text: string | null };
}

const CONTENT_TYPES: Record<string, string> = {
	'.css': 'text/css',
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.svg': 'image/svg+xml',
};

/** Serves a built app over HTTP on a free local port. */
async function serveDirectory(root: string): Promise<{ close: () => Promise<void>; url: string }> {
	const server = createServer((request, response) => {
		const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
		const file = path.join(root, pathname === '/' ? 'index.html' : pathname);
		readFile(file).then(
			(body) => {
				response.writeHead(200, {
					'content-type': CONTENT_TYPES[path.extname(file)] ?? 'application/octet-stream',
				});
				response.end(body);
			},
			() => {
				response.writeHead(404);
				response.end();
			},
		);
	});
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const { port } = server.address() as AddressInfo;
	return {
		close: () => new Promise((resolve) => server.close(() => resolve())),
		url: `http://127.0.0.1:${port}/`,
	};
}

function installedVersion(consumerDir: string, name: string): string {
	return readManifest(path.join(consumerDir, 'node_modules', name, 'package.json')).version;
}

function readManifest(file: string): Manifest {
	return JSON.parse(readFileSync(file, 'utf8')) as Manifest;
}

/** npm settings a developer or CI sets for network access, which consumer installs still need. */
const NETWORK_NPM_CONFIG_PATTERN =
	/^npm_config_(?:cache|cafile|https_proxy|noproxy|proxy|registry|userconfig)$/i;
const PACKAGE_MANAGER_ENV_PATTERN = /^(?:npm|pnpm)_/i;
const TEST_RUNNER_ENV_PATTERN = /^(?:NODE_ENV|NODE_OPTIONS|TEST|TURBO_.*|VITE_.*|VITEST.*)$/;

/**
 * Environment for consumer commands. It drops what the workspace scripts and the test runner set,
 * so npm, Node, and Vite behave as they would in an application.
 */
function consumerEnv(): NodeJS.ProcessEnv {
	return Object.fromEntries(
		Object.entries(process.env).filter(([key]) => {
			if (PACKAGE_MANAGER_ENV_PATTERN.test(key)) return NETWORK_NPM_CONFIG_PATTERN.test(key);
			return !TEST_RUNNER_ENV_PATTERN.test(key);
		}),
	);
}

function npm(args: Array<string>, cwd: string): string {
	return run('npm', args, cwd);
}

function run(command: string, args: Array<string>, cwd: string, env = consumerEnv()): string {
	return execFileSync(command, args, {
		cwd,
		encoding: 'utf8',
		env,
		maxBuffer: 64 * 1024 * 1024,
		stdio: ['ignore', 'pipe', 'pipe'],
	});
}

/** Runs a command and returns its output when it fails, or an empty string when it succeeds. */
function tryRun(command: string, args: Array<string>, cwd: string): string {
	try {
		run(command, args, cwd);
		return '';
	} catch (error) {
		const { stderr, stdout } = error as { stderr?: string; stdout?: string };
		return `${stdout ?? ''}${stderr ?? ''}`.trim() || String(error);
	}
}

/** The app the server renders and the browser hydrates. */
const APP = `
import { Blockquote } from '@luke-ui/react/blockquote';
import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { Provider } from '@luke-ui/react/provider';
import spritesheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { createElement as h, useEffect } from 'react';

/** Calls \`onHydrated\` after the first client commit. The server never runs effects. */
export function App({ onHydrated }) {
	useEffect(() => {
		onHydrated?.();
	}, [onHydrated]);
	return h(
		Provider,
		{ spritesheetHref },
		h(
			Box,
			{ display: 'flex', gap: 'sp8' },
			h(Blockquote, null, 'Hello world'),
			h(Icon, { name: 'chevronDown', 'aria-label': 'Expand' }),
			h(TextInputField, { label: 'Name' }),
			h(Button, null, 'Save'),
		),
	);
}
`;

const ENTRY_CLIENT = `
import '@luke-ui/react/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { createElement as h } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { App } from './app.js';

const recoverableErrors = [];
hydrateRoot(
	document.getElementById('root'),
	h(App, {
		onHydrated: () => {
			window.hydration = { recoverableErrors };
		},
	}),
	{ onRecoverableError: (error) => recoverableErrors.push(String(error)) },
);
`;

const ENTRY_SERVER = `
import { createElement as h } from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './app.js';

export function render() {
	return renderToString(h(App));
}
`;

/** The inline script snapshots the server DOM before the deferred module script hydrates it. */
const CLIENT_HTML = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<title>Luke UI consumer</title>
	</head>
	<body>
		<div id="root">${SSR_OUTLET}</div>
		<script>
			window.serverSnapshot = {
				elements: [...document.querySelectorAll('#root *')],
				text: document.getElementById('root').textContent,
			};
		</script>
		<script type="module" src="/src/entry-client.js"></script>
	</body>
</html>
`;

/** Builds the client app, then the server entry, with Vite's JS API. */
const BUILD_APP = `
import { build } from 'vite';

await build({ configFile: false, logLevel: 'error' });
await build({
	build: { outDir: 'dist-server', ssr: 'src/entry-server.js' },
	configFile: false,
	logLevel: 'error',
});
`;

/** Renders the app in Node and writes the markup into the built page, then prints it. */
const RENDER = `
import { readFileSync, writeFileSync } from 'node:fs';
import { render } from './dist-server/entry-server.js';

const markup = render();
const template = readFileSync('dist/index.html', 'utf8');
if (!template.includes('${SSR_OUTLET}')) throw new Error('The built page has no SSR outlet.');
writeFileSync('dist/index.html', template.replace('${SSR_OUTLET}', markup));
process.stdout.write(markup);
`;

/**
 * Builds one entry with Vite, with React and React DOM external, then prints the packages and the
 * `@luke-ui/*` source files that contribute code. It reads each `@luke-ui/*` dist file's own source
 * map to trace bundled code back to `src/`.
 */
const MEASURE_BUNDLE = `
import { readFileSync } from 'node:fs';
import { SourceMap } from 'node:module';
import path from 'node:path';
import { build } from 'vite';

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
// The last node_modules segment names the package, including inside a pnpm store path.
const PACKAGE_PATH = /^.*node_modules\\/((?:@[^/]+\\/)?[^/]+)\\/(.+)$/;

/** Decodes source map mappings into the original position of each segment. */
function* originalPositions(mappings) {
	let source = 0;
	let line = 0;
	let column = 0;
	for (const group of mappings.split(';')) {
		for (const segment of group.split(',')) {
			const values = [];
			let value = 0;
			let shift = 0;
			for (const character of segment) {
				const digit = BASE64.indexOf(character);
				value += (digit & 31) << shift;
				if (digit & 32) {
					shift += 5;
					continue;
				}
				values.push(value & 1 ? -(value >>> 1) : value >>> 1);
				value = 0;
				shift = 0;
			}
			if (values.length < 4) continue;
			source += values[1];
			line += values[2];
			column += values[3];
			yield { column, line, source };
		}
	}
}

const distMaps = new Map();
function distMap(file) {
	if (!distMaps.has(file)) {
		try {
			distMaps.set(file, new SourceMap(JSON.parse(readFileSync(\`\${file}.map\`, 'utf8'))));
		} catch {
			distMaps.set(file, undefined);
		}
	}
	return distMaps.get(file);
}

const [entry] = process.argv.slice(2);
const output = await build({
	configFile: false,
	logLevel: 'silent',
	build: {
		minify: false,
		rollupOptions: {
			external: (id) => /^(react|react-dom|scheduler)(\\/|$)/.test(id),
			input: path.resolve(entry),
			preserveEntrySignatures: 'exports-only',
		},
		sourcemap: true,
		write: false,
	},
});

const packages = new Set();
const sources = new Set();
for (const chunk of [output].flat().flatMap((result) => result.output)) {
	if (chunk.type !== 'chunk' || !chunk.map) continue;
	const chunkDir = path.resolve('dist', path.dirname(chunk.fileName));
	for (const position of originalPositions(chunk.map.mappings)) {
		const file = path.resolve(chunkDir, chunk.map.sources[position.source]);
		const match = PACKAGE_PATH.exec(file.replaceAll('\\\\', '/'));
		if (!match) continue;
		const [, name, inner] = match;
		if (!name.startsWith('@luke-ui/')) {
			packages.add(name);
			continue;
		}
		const map = distMap(file);
		// Vanilla Extract output maps to its one \`.css.ts\` source without mappings.
		const original =
			map?.findEntry(position.line, position.column)?.originalSource ??
			(map?.payload.sources.length === 1 ? map.payload.sources[0] : undefined);
		const resolved = original ? path.posix.join(path.posix.dirname(inner), original) : inner;
		// A dependency bundled into dist resolves to its own package.
		const bundled = PACKAGE_PATH.exec(resolved);
		packages.add(bundled ? bundled[1] : name);
		if (!bundled) sources.add(\`\${name}/\${resolved}\`);
	}
}
process.stdout.write(JSON.stringify({ packages: [...packages].sort(), sources: [...sources].sort() }));
`;

/** Representative typed usage. \`all-entries.ts\` covers the rest of the declaration graph. */
const TYPED_APP = `
import { Blockquote } from '@luke-ui/react/blockquote';
import { Box, type BoxProps } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Provider } from '@luke-ui/react/provider';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { breakpoints, defineTheme, type ThemeInput, vars } from '@luke-ui/react/theme';

const theme: ThemeInput = { name: 'fixture', color: { accent: '#3355ff' } };
export const css: string = defineTheme(theme);
export const textColor: string = vars.color.text.primary;
export const mobileBreakpoint: number = breakpoints.bp640;

const renderRoot: NonNullable<BoxProps['renderRoot']> = (domProps, state) => {
	const emptyState: Record<string, never> = state;
	return <section {...domProps} data-state-keys={Object.keys(emptyState).length} />;
};

// @ts-expect-error — renderRoot owns its element and excludes elementType
export const conflictingRoot: BoxProps = { elementType: 'section', renderRoot };
// @ts-expect-error — Box exposes no public render state properties
export const invalidRenderState: Parameters<typeof renderRoot>[1] = { isHovered: true };

export function App({ spritesheetHref }: { spritesheetHref: string }) {
	return (
		<Provider spritesheetHref={spritesheetHref}>
			<Box display="flex" gap="sp8">
				<Blockquote>Hello</Blockquote>
				<Box padding="sp16" renderRoot={renderRoot}>Owned root</Box>
				<TextInputField label="Name" />
				<Button onPress={() => {}}>Save</Button>
			</Box>
		</Provider>
	);
}
`;
