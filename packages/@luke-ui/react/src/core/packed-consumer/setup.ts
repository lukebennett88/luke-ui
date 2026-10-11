/**
 * Global setup for the packed-consumer scenarios, which run with `pnpm run test:consumer` because
 * their npm installs need network access.
 *
 * It packs the workspace builds of React, Paper, and Tactile, or fetches a published React when
 * `LUKE_UI_REACT_SPEC` names a version or dist-tag. It then installs one consumer outside the
 * repository with the newest peers the published ranges allow, and one with the lowest, and builds
 * both. Every scenario reads the result through `inject('packedConsumer')`.
 */

import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import type { TestProject } from 'vite-plus/test/node';
import type { Consumer, ConsumerFixture, PackedPackage } from './environment.js';
import {
	MINIMUM_TYPESCRIPT,
	measureBundle,
	npm,
	readManifest,
	run,
	scopeRoot,
} from './environment.js';
import { DEFINE_THEME_ENTRY, reactFixture } from './react-fixture.js';
import { themeFixture } from './theme-fixture.js';

const registrySpec = process.env.LUKE_UI_REACT_SPEC?.trim() || undefined;

const THEME_PACKAGES = ['@luke-ui/theme-paper', '@luke-ui/theme-tactile'];

const workspaceRequire = createRequire(import.meta.url);
/**
 * The consumer builds with the Vite the workspace installs, pinned exactly. Bundler drift is not part
 * of the package contract.
 */
const workspaceVite = readManifest(workspaceRequire.resolve('vite/package.json'));
const VITE_SPEC =
	workspaceVite.name === 'vite'
		? workspaceVite.version
		: `npm:${workspaceVite.name}@${workspaceVite.version}`;

/**
 * Theme modules that runtime code shares with theme generation. Every other theme module a
 * `defineTheme` import bundles counts as theme generation.
 */
const RUNTIME_THEME_MODULES = [
	'@luke-ui/react/src/theme/theme-class-name.ts',
	'@luke-ui/react/src/theme/type-styles.ts',
];
const THEME_MODULE_PATTERN = /^@luke-ui\/react\/src\/theme\//;

interface PeerSet {
	isLowest: boolean;
	label: string;
	/** Picks the version installed for a range. */
	resolve: (name: string, range: string) => string;
	slug: string;
	/** TypeScript range the set type-checks with. */
	typescriptRange: string;
}

export default async function setup(project: TestProject): Promise<() => Promise<void>> {
	const workDir = await mkdtemp(path.join(tmpdir(), 'luke-ui-consumer-'));

	const react =
		registrySpec === undefined
			? await packWorkspacePackage(workDir, '@luke-ui/react')
			: await fetchFromRegistry(workDir, registrySpec);
	let themes: Array<PackedPackage> = [];
	if (registrySpec === undefined) {
		themes = await Promise.all(THEME_PACKAGES.map((name) => packWorkspacePackage(workDir, name)));
	} else {
		process.stdout.write(
			'Skipping the theme package checks: LUKE_UI_REACT_SPEC tests a published @luke-ui/react, and ' +
				'the theme packages have no matching published versions to install beside it.\n',
		);
	}
	const fixtures = [reactFixture(react)];
	if (themes.length > 0) fixtures.push(themeFixture(themes));

	const peerSets: Array<PeerSet> = [
		{
			isLowest: false,
			label: 'the newest peers',
			resolve: (_name, range) => range,
			slug: 'newest',
			typescriptRange: readManifest(workspaceRequire.resolve('typescript/package.json')).version,
		},
		{
			isLowest: true,
			label: `the lowest peers and TypeScript ${MINIMUM_TYPESCRIPT}`,
			resolve: (name, range) => lowestPublished(workDir, name, range),
			slug: 'lowest',
			typescriptRange: `~${MINIMUM_TYPESCRIPT}.0`,
		},
	];
	// Each consumer installs and builds with synchronous commands, so they still run one at a time.
	const consumers = await Promise.all(
		peerSets.map((peerSet) =>
			createConsumer(path.join(workDir, peerSet.slug), peerSet, react, fixtures),
		),
	);

	project.provide('packedConsumer', { consumers, react, registrySpec, themes });
	return () => rm(workDir, { force: true, recursive: true });
}

/** Installs a consumer application, prepares its fixtures, and builds it. */
async function createConsumer(
	dir: string,
	peerSet: PeerSet,
	react: PackedPackage,
	fixtures: Array<ConsumerFixture>,
): Promise<Consumer> {
	const peers = Object.fromEntries(
		Object.entries(react.manifest.peerDependencies).map(([name, range]) => [
			name,
			peerSet.resolve(name, range),
		]),
	);
	const typescript = peerSet.resolve('typescript', peerSet.typescriptRange);
	const reactRange = react.manifest.peerDependencies.react;
	if (reactRange === undefined) throw new Error('Expected a react peer range.');
	const typeChecked = fixtures.flatMap((fixture) => fixture.typeChecked);

	const files: Record<string, string> = {
		'package.json': JSON.stringify(
			{
				name: `luke-ui-consumer-${peerSet.slug}`,
				private: true,
				type: 'module',
				dependencies: {
					...Object.assign({}, ...fixtures.map((fixture) => fixture.dependencies)),
					...peers,
				},
				devDependencies: {
					...Object.assign({}, ...fixtures.map((fixture) => fixture.devDependencies)),
					// The React types follow the React peer range, so the lowest set gets the lowest types.
					'@types/react': peerSet.resolve('@types/react', reactRange),
					'@types/react-dom': peerSet.resolve('@types/react-dom', reactRange),
					typescript,
					vite: VITE_SPEC,
				},
			},
			null,
			2,
		),
		'tsconfig.bundler.json': tsconfig('esnext', 'bundler', typeChecked),
		'tsconfig.nodenext.json': tsconfig('nodenext', 'nodenext', typeChecked),
		...Object.assign({}, ...fixtures.map((fixture) => fixture.files)),
	};
	await Promise.all(
		Object.entries(files).map(async ([name, source]) => {
			await mkdir(path.dirname(path.join(dir, name)), { recursive: true });
			await writeFile(path.join(dir, name), source);
		}),
	);
	npm(['install', '--no-audit', '--no-fund', '--ignore-scripts'], dir);

	for (const [command, ...args] of fixtures.flatMap((fixture) => fixture.prepare)) {
		run(command!, args, dir);
	}
	run('node', ['build-app.mjs'], dir);

	return {
		dir,
		isLowest: peerSet.isLowest,
		label: peerSet.label,
		peers,
		themeGenerationSources: measureBundle(dir, DEFINE_THEME_ENTRY).sources.filter(
			(source) => THEME_MODULE_PATTERN.test(source) && !RUNTIME_THEME_MODULES.includes(source),
		),
		typescript,
	};
}

function tsconfig(module: string, moduleResolution: string, files: Array<string>): string {
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
			files,
		},
		null,
		2,
	);
}

/**
 * Packs a workspace package. npm cannot resolve an unreleased workspace dependency, so its
 * `@luke-ui/*` dependencies are packed beside it.
 */
async function packWorkspacePackage(workDir: string, name: string): Promise<PackedPackage> {
	const slug = name.slice('@luke-ui/'.length);
	const tarball = await pnpmPack(workDir, slug);
	const contents = await extract(workDir, tarball, slug);
	const manifest = readManifest(path.join(contents, 'package.json'));

	const workspaceDependencies = await Promise.all(
		Object.keys(manifest.dependencies ?? {})
			.filter((dependency) => dependency.startsWith('@luke-ui/'))
			.map(async (dependency) => {
				const dependencyTarball = await pnpmPack(workDir, dependency.slice('@luke-ui/'.length));
				return [dependency, `file:${dependencyTarball}`] as const;
			}),
	);
	const installSpecs = { [name]: `file:${tarball}`, ...Object.fromEntries(workspaceDependencies) };
	return { contents, files: listFiles(contents), installSpecs, manifest };
}

async function fetchFromRegistry(workDir: string, version: string): Promise<PackedPackage> {
	const spec = `@luke-ui/react@${version}`;
	const destination = path.join(workDir, 'pack', 'registry');
	await mkdir(destination, { recursive: true });
	npm(['pack', spec, '--pack-destination', destination], workDir);
	const contents = await extract(
		workDir,
		path.join(destination, onlyTarball(destination)),
		'react',
	);
	return {
		contents,
		files: listFiles(contents),
		installSpecs: { '@luke-ui/react': spec },
		manifest: readManifest(path.join(contents, 'package.json')),
	};
}

async function pnpmPack(workDir: string, slug: string): Promise<string> {
	const destination = path.join(workDir, 'pack', slug);
	await mkdir(destination, { recursive: true });
	run('pnpm', ['pack', '--pack-destination', destination], path.join(scopeRoot, slug), process.env);
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

async function extract(workDir: string, tarball: string, slug: string): Promise<string> {
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

/** Lowest published version a range admits, so the lowest set never floats. */
function lowestPublished(workDir: string, name: string, range: string): string {
	const versions: unknown = JSON.parse(
		npm(['view', `${name}@${range}`, 'version', '--json'], workDir),
	);
	const lowest = Array.isArray(versions) ? versions[0] : versions;
	if (typeof lowest !== 'string') {
		throw new Error(`No published version of ${name} satisfies "${range}".`);
	}
	return lowest;
}
