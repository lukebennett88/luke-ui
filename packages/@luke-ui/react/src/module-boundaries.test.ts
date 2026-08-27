import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { access, readdir, readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

const sourceRoot = fileURLToPath(new URL('./', import.meta.url));
const sourceZones = new Set(['core', 'exports', 'shared', 'theme']);
const sourceFilePattern = /\.(?:ts|tsx)$/;
const excludedSourcePattern = /(?:\.test\.|\.stories\.|__fixtures__)/;
const relativeImportPattern = /(?:from\s+|import\s+)(['"])(\.\.?\/[^'"]+)\1/g;

type SourceZone = 'core' | 'exports' | 'shared' | 'theme';

test('keeps source imports flowing between core, exports, shared, and theme', async () => {
	const sourceFiles = await collectSourceFiles(sourceRoot);
	const violations = (await Promise.all(sourceFiles.map(findBoundaryViolations))).flat();

	expect(violations).toEqual([]);
});

// The dependency graph, driven against synthetic zone pairs rather than files on disk, so every
// forbidden edge is proven to fail if `isForbiddenEdge` stopped reporting it, and every allowed
// edge is proven not to false-positive.
test.for([
	['shared', 'core'],
	['shared', 'theme'],
	['shared', 'exports'],
	['core', 'exports'],
	['theme', 'core'],
	['exports', 'shared'],
] as const)('reports %s -> %s as a violation', ([sourceZone, targetZone]) => {
	expect(isForbiddenEdge(sourceZone, targetZone)).toBe(true);
});

test.for([
	['exports', 'core'],
	['exports', 'theme'],
	['core', 'shared'],
	['core', 'theme'],
	['theme', 'shared'],
] as const)('allows %s -> %s', ([sourceZone, targetZone]) => {
	expect(isForbiddenEdge(sourceZone, targetZone)).toBe(false);
});

/**
 * Whether an import from `sourceZone` to `targetZone` breaks the dependency graph:
 *
 * - `exports` may only reach `core` and `theme`.
 * - `core` may not reach `exports`.
 * - `theme` may not reach `core`.
 * - `shared` may not reach `core`, `theme`, or `exports`.
 */
function isForbiddenEdge(sourceZone: SourceZone, targetZone: SourceZone): boolean {
	if (sourceZone === targetZone) return false;
	if (sourceZone === 'shared') return true;
	if (sourceZone === 'core' && targetZone === 'exports') return true;
	if (sourceZone === 'theme' && targetZone === 'core') return true;
	if (sourceZone === 'exports' && targetZone !== 'core' && targetZone !== 'theme') return true;

	return false;
}

async function findBoundaryViolations(sourceFile: string): Promise<Array<string>> {
	const sourceZone = sourceZoneFor(sourceFile);
	if (sourceZone === undefined) return [];

	const source = await readFile(sourceFile, 'utf8');
	const imports = [...source.matchAll(relativeImportPattern)].flatMap((match) => {
		const specifier = match[2];
		return specifier === undefined ? [] : [specifier];
	});
	const targetFiles = await Promise.all(
		imports.map((specifier) => resolveRelativeImport(sourceFile, specifier)),
	);

	return targetFiles.flatMap((targetFile, index) => {
		const targetZone = sourceZoneFor(targetFile);
		if (targetZone === undefined) return [];

		const specifier = imports[index];
		if (specifier === undefined) return [];
		if (!isForbiddenEdge(sourceZone, targetZone)) return [];

		return [`${path.relative(sourceRoot, sourceFile)} -> ${specifier}`];
	});
}

async function collectSourceFiles(directory: string): Promise<Array<string>> {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const entryPath = path.join(directory, entry.name);
			if (entry.isDirectory()) return collectSourceFiles(entryPath);
			if (!sourceFilePattern.test(entry.name) || excludedSourcePattern.test(entryPath)) return [];
			return [entryPath];
		}),
	);

	return files.flat();
}

async function resolveRelativeImport(sourceFile: string, specifier: string): Promise<string> {
	const target = path.resolve(path.dirname(sourceFile), specifier.split(/[?#]/)[0] ?? specifier);
	if (!target.startsWith(`${sourceRoot}${path.sep}`)) return target;

	const candidates = [target, target.replace(/\.js$/, '.ts'), target.replace(/\.js$/, '.tsx')];

	const resolvedCandidates = await Promise.all(
		candidates.map(async (candidate) => {
			try {
				await access(candidate);
				return candidate;
			} catch {
				return undefined;
			}
		}),
	);
	const resolved = resolvedCandidates.find((candidate) => candidate !== undefined);
	if (resolved !== undefined) return resolved;

	throw new Error(`Could not resolve ${specifier} from ${path.relative(sourceRoot, sourceFile)}.`);
}

function sourceZoneFor(filePath: string): SourceZone | undefined {
	const [zone] = path.relative(sourceRoot, filePath).split(path.sep);
	return zone !== undefined && sourceZones.has(zone) ? (zone as SourceZone) : undefined;
}
