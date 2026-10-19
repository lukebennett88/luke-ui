import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
	Cache,
	GeneratedDoc,
	Generator,
	GeneratorOptions,
	Project,
} from 'fumadocs-typescript';
import { createGenerator, createProject, generateHash } from 'fumadocs-typescript';
import { readFile } from 'node:fs/promises';
import { collectTypescriptSourceGraph } from './typescript-source-graph.js';

/** Bump when the live-generator cache payload shape or key inputs change. */
const LIVE_GENERATOR_CACHE_VERSION = '1';

/** Matches upstream `createGenerator` cache keys so upgrades cannot reuse incompatible output. */
const FUMADOCS_TYPESCRIPT_VERSION = readFumadocsTypescriptVersion();

/**
 * Options for the live generator. Omits `project`: this wrapper owns the TypeScript process and
 * replaces it after cache misses. Callers pass `tsconfigPath` (and optional cache) only.
 */
export type LiveTypescriptGeneratorOptions = Omit<GeneratorOptions, 'project'>;

/**
 * Wraps `createGenerator` so API tables follow disk edits during `vp dev` without restarting.
 *
 * Two fumadocs-typescript behaviours otherwise keep stale output:
 * 1. `createFileSystemGeneratorCache` keys only on the documented file's content, so an imported
 *    type can change while the cache still hits.
 * 2. After a file is first loaded, writing that file on disk and generating again can leave the
 *    native TypeScript program on the old text — `getSourceFile` sees matching overlay/disk content
 *    and skips a snapshot update.
 *
 * This wrapper keys the cache on a hash of the entry file plus its relative import graph and the
 * installed fumadocs-typescript version, and uses a fresh TypeScript project on each cache miss so
 * the program always reads current sources. Creating a project is cheap relative to type
 * collection; cache hits skip that work entirely. Overlapping cache misses share one
 * reset-and-generate queue so concurrent tables cannot close a project still in use.
 *
 * The project passed to `createGenerator` is a stable stand-in that delegates to the current native
 * process. `createGenerator` only reads that object during generation (`await getProject()`), and
 * this wrapper always `await`s `slot.reset()` on a cache miss before calling through — so the
 * stand-in never needs to be a thenable, and TypeScript is not started at module load (knip and
 * cycle checks import `source.config` from the repo root).
 */
export function createLiveTypescriptGenerator(
	options: LiveTypescriptGeneratorOptions = {},
): Generator {
	const storage = resolveCache(options.cache);
	const slot = createProjectSlot({ tsconfigPath: options.tsconfigPath });
	const generator = createGenerator({
		...options,
		cache: false,
		project: slot.project,
	});
	const generateDocumentation = generator.generateDocumentation.bind(generator);

	/** Serializes cache-miss work so overlapping resets cannot close a project still in use. */
	let missQueue: Promise<unknown> = Promise.resolve();

	function runExclusiveMiss<T>(work: () => Promise<T>): Promise<T> {
		const run = missQueue.then(work, work);
		missQueue = run.then(
			() => undefined,
			() => undefined,
		);
		return run;
	}

	generator.generateDocumentation = async (file, name, generateOptions = {}) => {
		const fullPath = resolve(file.path);
		const content = file.content ?? (await readFile(fullPath, 'utf8'));
		const graphHash = collectTypescriptSourceGraph(fullPath, content).hash;
		const cacheKey =
			storage === null
				? undefined
				: generateHash(
						`${fullPath}:${name ?? ''}:${graphHash}:${FUMADOCS_TYPESCRIPT_VERSION}:${LIVE_GENERATOR_CACHE_VERSION}`,
					);

		if (storage !== null && cacheKey !== undefined) {
			const cached = await storage.read(cacheKey);
			if (cached !== undefined) return cached as Array<GeneratedDoc>;
		}

		return runExclusiveMiss(async () => {
			// Another overlapping miss may have filled the cache while this request waited.
			if (storage !== null && cacheKey !== undefined) {
				const cached = await storage.read(cacheKey);
				if (cached !== undefined) return cached as Array<GeneratedDoc>;
			}

			await slot.reset();
			const docs = await generateDocumentation({ path: fullPath, content }, name, generateOptions);

			if (storage !== null && cacheKey !== undefined) {
				await storage.write(cacheKey, docs);
			}
			return docs;
		});
	};

	return generator;
}

function resolveCache(cache: LiveTypescriptGeneratorOptions['cache']): Cache | null {
	if (cache === undefined || cache === false) return null;
	return cache;
}

/**
 * Stable `Project` for `createGenerator`: methods forward to the current native process. Reset
 * closes that process and creates a new one so disk edits are visible on the next generate.
 */
function createProjectSlot(projectOptions: { tsconfigPath?: string }) {
	let current: Project | undefined;
	let boot: Promise<Project> | undefined;

	async function ensure(): Promise<Project> {
		if (current !== undefined) return current;
		boot ??= createProject(projectOptions).then((project) => {
			current = project;
			return project;
		});
		return boot;
	}

	function requireCurrent(): Project {
		if (current === undefined) {
			throw new Error('TypeScript project used before reset completed');
		}
		return current;
	}

	const project: Project = {
		get api() {
			return requireCurrent().api;
		},
		get tsconfigPath() {
			return requireCurrent().tsconfigPath;
		},
		getSourceFile(filePath: string, content?: string) {
			return requireCurrent().getSourceFile(filePath, content);
		},
		close() {
			current?.close();
			current = undefined;
			boot = undefined;
		},
	};

	return {
		project,
		async reset() {
			current?.close();
			current = undefined;
			boot = undefined;
			await ensure();
		},
	};
}

function readFumadocsTypescriptVersion(): string {
	const entryUrl = import.meta.resolve('fumadocs-typescript');
	let dir = dirname(fileURLToPath(entryUrl));
	for (;;) {
		try {
			const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
				name?: string;
				version?: string;
			};
			if (pkg.name === 'fumadocs-typescript' && typeof pkg.version === 'string') {
				return pkg.version;
			}
		} catch {
			// Keep walking toward the package root.
		}
		const parent = dirname(dir);
		if (parent === dir) {
			throw new Error('Could not resolve fumadocs-typescript package version');
		}
		dir = parent;
	}
}
