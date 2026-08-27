import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { access, readdir, readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

const sourceRoot = fileURLToPath(new URL('../', import.meta.url));
const sourceZones = new Set(['core', 'exports', 'theme']);
const sourceFilePattern = /\.(?:ts|tsx)$/;
const excludedSourcePattern = /(?:\.test\.|\.stories\.|__fixtures__)/;
const relativeImportPattern = /(?:from\s+|import\s+)(['"])(\.\.?\/[^'"]+)\1/g;

test('keeps source imports flowing from exports to core and theme', async () => {
	const sourceFiles = await collectSourceFiles(sourceRoot);
	const violations = (await Promise.all(sourceFiles.map(findBoundaryViolations))).flat();

	expect(violations).toEqual([]);
});

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
		const importDescription = `${path.relative(sourceRoot, sourceFile)} -> ${specifier}`;
		if (sourceZone === 'core' && targetZone === 'exports') return [importDescription];
		if (sourceZone === 'theme' && targetZone === 'core') return [importDescription];
		if (sourceZone === 'exports' && targetZone !== 'core' && targetZone !== 'theme') {
			return [importDescription];
		}

		return [];
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

function sourceZoneFor(filePath: string): 'core' | 'exports' | 'theme' | undefined {
	const [zone] = path.relative(sourceRoot, filePath).split(path.sep);
	return zone !== undefined && sourceZones.has(zone)
		? (zone as 'core' | 'exports' | 'theme')
		: undefined;
}
