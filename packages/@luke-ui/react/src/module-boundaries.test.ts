import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { access, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { afterEach, expect, test } from 'vite-plus/test';

const sourceRoot = fileURLToPath(new URL('./', import.meta.url));
const sourceZones = new Set(['core', 'exports', 'shared', 'theme']);
const sourceFilePattern = /\.(?:ts|tsx)$/;
const excludedSourcePattern = /(?:\.test\.|\.stories\.|__fixtures__)/;
const relativeImportPattern = /(?:from\s+|import\s+)(['"])(\.\.?\/[^'"]+)\1/g;

type SourceZone = 'core' | 'exports' | 'shared' | 'theme';

// The zones a source zone may import from. A missing key is a compile error, not a runtime
// `undefined`, so a new zone cannot silently bypass enforcement.
const MAY_IMPORT: Record<SourceZone, ReadonlyArray<SourceZone>> = {
	core: ['theme', 'shared'],
	exports: ['core', 'theme', 'shared'],
	shared: [],
	theme: ['shared'],
};

const testDirectories: Array<string> = [];

afterEach(async () => {
	await Promise.all(
		testDirectories.map((directory) => rm(directory, { force: true, recursive: true })),
	);
	testDirectories.length = 0;
});

test('keeps source imports flowing between core, exports, shared, and theme', async () => {
	const sourceFiles = await collectSourceFiles(sourceRoot);
	const violations = (
		await Promise.all(
			sourceFiles.map((sourceFile) => findBoundaryViolations(sourceRoot, sourceFile)),
		)
	).flat();

	expect(violations).toEqual([]);
});

// The dependency graph, driven against synthetic zone pairs rather than files on disk, so every
// forbidden edge is proven to fail if `isForbiddenEdge` stopped reporting it, and every allowed
// edge is proven not to false-positive. Exhaustive over all 16 zone pairs so no pair can be
// silently omitted in future.
test.for([
	['shared', 'core'],
	['shared', 'theme'],
	['shared', 'exports'],
	['core', 'exports'],
	['theme', 'core'],
	['theme', 'exports'],
] as const)('reports %s -> %s as a violation', ([sourceZone, targetZone]) => {
	expect(isForbiddenEdge(sourceZone, targetZone)).toBe(true);
});

test.for([
	['exports', 'core'],
	['exports', 'theme'],
	['exports', 'shared'],
	['core', 'shared'],
	['core', 'theme'],
	['theme', 'shared'],
] as const)('allows %s -> %s', ([sourceZone, targetZone]) => {
	expect(isForbiddenEdge(sourceZone, targetZone)).toBe(false);
});

test.for([
	['core', 'core'],
	['exports', 'exports'],
	['shared', 'shared'],
	['theme', 'theme'],
] as const)('allows %s -> %s (same zone)', ([sourceZone, targetZone]) => {
	expect(isForbiddenEdge(sourceZone, targetZone)).toBe(false);
});

// The synthetic cases above call `isForbiddenEdge` directly with string literals, so they cannot
// catch a regression in the code that actually walks the tree. Drive the real scanning path
// (`collectSourceFiles`, `resolveRelativeImport`, `sourceZoneFor`) against an on-disk fixture so a
// broken zone classification (for example `sourceZoneFor` no longer recognising `theme`) fails this
// test instead of silently reporting zero violations everywhere.
test('detects a real on-disk forbidden import via the file-walking scanner', async () => {
	const root = await createFixtureRoot({
		'theme/offender.ts': "import { helper } from '../exports/helper.js';\n",
		'exports/helper.ts': 'export const helper = 1;\n',
	});

	const sourceFiles = await collectSourceFiles(root);
	const violations = (
		await Promise.all(sourceFiles.map((sourceFile) => findBoundaryViolations(root, sourceFile)))
	).flat();

	expect(violations).toEqual([`theme/offender.ts -> ../exports/helper.js`]);
});

test('reports no violations for a real on-disk allowed import via the file-walking scanner', async () => {
	const root = await createFixtureRoot({
		'theme/consumer.ts': "import { helper } from '../shared/helper.js';\n",
		'shared/helper.ts': 'export const helper = 1;\n',
	});

	const sourceFiles = await collectSourceFiles(root);
	const violations = (
		await Promise.all(sourceFiles.map((sourceFile) => findBoundaryViolations(root, sourceFile)))
	).flat();

	expect(violations).toEqual([]);
});

async function createFixtureRoot(files: Record<string, string>): Promise<string> {
	const root = await mkdtemp(path.join(tmpdir(), 'module-boundaries-'));
	testDirectories.push(root);

	await Promise.all(
		Object.entries(files).map(async ([relativePath, contents]) => {
			const filePath = path.join(root, relativePath);
			await mkdir(path.dirname(filePath), { recursive: true });
			await writeFile(filePath, contents, 'utf8');
		}),
	);

	return root;
}

/**
 * Whether an import from `sourceZone` to `targetZone` breaks the dependency graph. See
 * {@link MAY_IMPORT} for the allow-list each zone is checked against.
 */
function isForbiddenEdge(sourceZone: SourceZone, targetZone: SourceZone): boolean {
	return sourceZone !== targetZone && !MAY_IMPORT[sourceZone].includes(targetZone);
}

async function findBoundaryViolations(root: string, sourceFile: string): Promise<Array<string>> {
	const sourceZone = sourceZoneFor(root, sourceFile);
	if (sourceZone === undefined) return [];

	const source = await readFile(sourceFile, 'utf8');
	const imports = [...source.matchAll(relativeImportPattern)].flatMap((match) => {
		const specifier = match[2];
		return specifier === undefined ? [] : [specifier];
	});
	const targetFiles = await Promise.all(
		imports.map((specifier) => resolveRelativeImport(root, sourceFile, specifier)),
	);

	return targetFiles.flatMap((targetFile, index) => {
		const targetZone = sourceZoneFor(root, targetFile);
		if (targetZone === undefined) return [];

		const specifier = imports[index];
		if (specifier === undefined) return [];
		if (!isForbiddenEdge(sourceZone, targetZone)) return [];

		return [`${path.relative(root, sourceFile)} -> ${specifier}`];
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

async function resolveRelativeImport(
	root: string,
	sourceFile: string,
	specifier: string,
): Promise<string> {
	const target = path.resolve(path.dirname(sourceFile), specifier.split(/[?#]/)[0] ?? specifier);
	if (!target.startsWith(`${root}${path.sep}`)) return target;

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

	throw new Error(`Could not resolve ${specifier} from ${path.relative(root, sourceFile)}.`);
}

function sourceZoneFor(root: string, filePath: string): SourceZone | undefined {
	const [zone] = path.relative(root, filePath).split(path.sep);
	return zone !== undefined && sourceZones.has(zone) ? (zone as SourceZone) : undefined;
}
