/**
 * What the packed-consumer setup prepares and every scenario reads: the packed packages, the
 * consumer installs, and the commands that run inside them. Scenarios never install or build. They
 * read the consumers `setup.ts` prepares, so no test depends on another running first.
 */

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

/**
 * The oldest TypeScript that accepts the published declarations. The Installation page states this
 * floor, so change both together.
 */
export const MINIMUM_TYPESCRIPT = '5.8';

export const repoRoot = fileURLToPath(new URL('../../../../../..', import.meta.url));
/** The workspace directory that holds every `@luke-ui/*` package. */
export const scopeRoot = path.join(repoRoot, 'packages', '@luke-ui');

export interface Manifest {
	dependencies?: Record<string, string>;
	exports: Record<string, string>;
	name: string;
	peerDependencies: Record<string, string>;
	private?: boolean;
	version: string;
}

/** A package as a consumer installs it: from a workspace tarball, or from the registry. */
export interface PackedPackage {
	/** Package root extracted from the tarball. */
	contents: string;
	/** Tarball paths relative to `package/`. */
	files: Array<string>;
	/** Dependency specs that install the package, and any packed workspace dependencies. */
	installSpecs: Record<string, string>;
	manifest: Manifest;
}

/** One consumer application, installed with one peer set and already built. */
export interface Consumer {
	dir: string;
	/** Whether the consumer installs the lowest version each peer range allows. */
	isLowest: boolean;
	label: string;
	/** The exact peer versions installed. */
	peers: Record<string, string>;
	/** Theme modules a `defineTheme` import bundles, apart from those runtime code shares. */
	themeGenerationSources: Array<string>;
	/** The exact TypeScript version installed. */
	typescript: string;
}

interface PackedConsumerContext {
	consumers: Array<Consumer>;
	react: PackedPackage;
	/** The published React version under test, or `undefined` for the workspace build. */
	registrySpec: string | undefined;
	/** The packed theme packages. Empty when the run tests a published React. */
	themes: Array<PackedPackage>;
}

/** Files one scenario adds to every consumer, and what they need installed and type-checked. */
export interface ConsumerFixture {
	/** Install specs for the packages under test. */
	dependencies: Record<string, string>;
	devDependencies: Record<string, string>;
	/** Source keyed by path within the consumer. */
	files: Record<string, string>;
	/** Commands the consumer runs after installing and before building. */
	prepare: Array<Array<string>>;
	/** Files the consumer type-checks with both `bundler` and `nodenext` resolution. */
	typeChecked: Array<string>;
}

declare module 'vitest' {
	export interface ProvidedContext {
		packedConsumer: PackedConsumerContext;
	}
}

/** The only paths a tarball may contain. */
const PUBLISHED_PATH_PATTERN = /^(?:dist\/|skills\/|LICENSE$|README\.md$|package\.json$)/;

/** Tarball files outside the published paths, and export targets missing from the tarball. */
export function packageContentProblems({ files, manifest }: PackedPackage): {
	missingTargets: Array<string>;
	unpublished: Array<string>;
} {
	return {
		missingTargets: Object.values(manifest.exports)
			.map((target) => target.slice(2))
			.filter((target) => !files.includes(target)),
		unpublished: files.filter((file) => !PUBLISHED_PATH_PATTERN.test(file)),
	};
}

export function readManifest(file: string): Manifest {
	return JSON.parse(readFileSync(file, 'utf8')) as Manifest;
}

export function installedVersion(consumerDir: string, name: string): string {
	return readManifest(path.join(consumerDir, 'node_modules', name, 'package.json')).version;
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

export function run(
	command: string,
	args: Array<string>,
	cwd: string,
	env = consumerEnv(),
): string {
	return execFileSync(command, args, {
		cwd,
		encoding: 'utf8',
		env,
		maxBuffer: 64 * 1024 * 1024,
		stdio: ['ignore', 'pipe', 'pipe'],
	});
}

export function npm(args: Array<string>, cwd: string): string {
	return run('npm', args, cwd);
}

/** Runs a command and returns its output when it fails, or an empty string when it succeeds. */
export function tryRun(command: string, args: Array<string>, cwd: string): string {
	try {
		run(command, args, cwd);
		return '';
	} catch (error) {
		const { stderr, stdout } = error as { stderr?: string; stdout?: string };
		return `${stdout ?? ''}${stderr ?? ''}`.trim() || String(error);
	}
}

/** Packages, and `@luke-ui/*` source files, that contribute code to a bundle of one entry. */
export function measureBundle(
	consumerDir: string,
	entry: string,
): { packages: Array<string>; sources: Array<string> } {
	return JSON.parse(run('node', ['measure-bundle.mjs', `entries/${entry}.js`], consumerDir));
}

/** Packages that only theme generation needs. */
const THEME_GENERATION_PACKAGE_PATTERN = /^@capsizecss\//;

/** Packages and source files in a bundle that only theme generation needs. */
export function themeGenerationIn(
	bundle: { packages: Array<string>; sources: Array<string> },
	consumer: Consumer,
): Array<string> {
	return [
		...bundle.packages.filter((name) => THEME_GENERATION_PACKAGE_PATTERN.test(name)),
		...bundle.sources.filter((source) => consumer.themeGenerationSources.includes(source)),
	];
}

/** The built client assets: their names, and the joined contents of those with one extension. */
export function builtAssets(consumerDir: string) {
	const assetsDir = path.join(consumerDir, 'dist', 'assets');
	const names = readdirSync(assetsDir);
	return {
		names,
		read: (extension: string) =>
			names
				.filter((name) => name.endsWith(extension))
				.map((name) => readFileSync(path.join(assetsDir, name), 'utf8'))
				.join('\n'),
	};
}

const CONTENT_TYPES: Record<string, string> = {
	'.css': 'text/css',
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.svg': 'image/svg+xml',
	'.woff2': 'font/woff2',
};

/** Serves a consumer's built pages over HTTP on a free local port. */
export async function serveBuild(
	consumerDir: string,
): Promise<{ close: () => Promise<void>; url: string }> {
	const root = path.join(consumerDir, 'dist');
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
