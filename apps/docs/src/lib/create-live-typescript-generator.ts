import { resolve } from 'node:path';
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
 * This wrapper keys the cache on a hash of the entry file plus its relative import graph, and uses a
 * fresh TypeScript project on each cache miss so the program always reads current sources. Creating
 * a project is cheap relative to type collection; cache hits skip that work entirely.
 */
export function createLiveTypescriptGenerator(options: GeneratorOptions = {}): Generator {
	const storage = resolveCache(options.cache);
	const projectOptions = {
		tsconfigPath: options.tsconfigPath,
	};
	const slot = createProjectSlot(options.project, projectOptions);
	const generator = createGenerator({
		...options,
		cache: false,
		// Thenable so createGenerator can `await` it without booting TypeScript at module load
		// (knip and cycle checks import source.config from the repo root).
		project: slot.lazy as unknown as Project,
	});
	const generateDocumentation = generator.generateDocumentation.bind(generator);

	generator.generateDocumentation = async (file, name, generateOptions = {}) => {
		const fullPath = resolve(file.path);
		const content = file.content ?? (await readFile(fullPath, 'utf8'));
		const graphHash = collectTypescriptSourceGraph(fullPath, content).hash;
		const cacheKey =
			storage === null
				? undefined
				: generateHash(`${fullPath}:${name ?? ''}:${graphHash}:${LIVE_GENERATOR_CACHE_VERSION}`);

		if (storage !== null && cacheKey !== undefined) {
			const cached = await storage.read(cacheKey);
			if (cached !== undefined) return cached as Array<GeneratedDoc>;
		}

		// Drop the previous native program so primary and imported files are read from disk again.
		await slot.reset();

		const docs = await generateDocumentation({ path: fullPath, content }, name, generateOptions);

		if (storage !== null && cacheKey !== undefined) {
			await storage.write(cacheKey, docs);
		}
		return docs;
	};

	return generator;
}

function resolveCache(cache: GeneratorOptions['cache']): Cache | null {
	if (cache === undefined || cache === false) return null;
	return cache;
}

/**
 * Holds the fumadocs project behind a stable object so `createGenerator` can keep one `project`
 * reference while we replace the native TypeScript process after cache misses.
 */
function createProjectSlot(
	initial: GeneratorOptions['project'],
	projectOptions: { tsconfigPath?: string },
) {
	let current: Project | undefined;
	let boot: Promise<Project> | undefined;

	async function ensure(): Promise<Project> {
		if (current !== undefined) return current;
		boot ??= Promise.resolve(initial ?? createProject(projectOptions)).then((project) => {
			current = project;
			return project;
		});
		return boot;
	}

	const proxy = {
		get api() {
			if (current === undefined) {
				throw new Error('TypeScript project used before it finished loading');
			}
			return current.api;
		},
		get tsconfigPath() {
			if (current === undefined) {
				throw new Error('TypeScript project used before it finished loading');
			}
			return current.tsconfigPath;
		},
		getSourceFile(filePath: string, content?: string) {
			if (current === undefined) {
				throw new Error('TypeScript project used before it finished loading');
			}
			return current.getSourceFile(filePath, content);
		},
		close() {
			current?.close();
			current = undefined;
			boot = undefined;
		},
	} as Project;

	return {
		/** Starts `createProject` only when createGenerator first awaits the project. */
		lazy: {
			then(
				onFulfilled?: ((value: Project) => unknown) | null,
				onRejected?: ((reason: unknown) => unknown) | null,
			) {
				return ensure()
					.then(() => proxy)
					.then(onFulfilled, onRejected);
			},
		},
		async reset() {
			current?.close();
			current = undefined;
			boot = undefined;
			initial = undefined;
			await ensure();
		},
	};
}
