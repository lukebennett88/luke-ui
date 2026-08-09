import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir } from 'node:fs/promises';
// Reads the real Vitest project config so this check cannot drift from it:
// the `test.include` glob on each project in `../vitest.config.ts` is the
// source of truth for which suffixes Vitest actually runs.
import vitestConfig from '../vitest.config';
import { findStrayTestFiles } from './check-test-suffixes-lib.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignoredDirNames = new Set([
	'node_modules',
	'dist',
	'.turbo',
	'.generated',
	'storybook-static',
]);

type VitestProjectConfig = { test?: { include?: Array<string> } };
type VitestRootConfig = { test?: { projects?: Array<VitestProjectConfig> } };

function getIncludeGlobs(config: unknown): Array<string> {
	const projects = (config as VitestRootConfig).test?.projects ?? [];
	return projects.flatMap((project) => project.test?.include ?? []);
}

async function collectTestFiles(root: string): Promise<Array<string>> {
	const results: Array<string> = [];

	async function visit(directory: string) {
		const entries = await readdir(directory, { withFileTypes: true });
		await Promise.all(
			entries.map(async (entry) => {
				const entryPath = path.join(directory, entry.name);
				if (entry.isDirectory()) {
					if (ignoredDirNames.has(entry.name)) return;
					await visit(entryPath);
					return;
				}
				if (/\.test\.tsx?$/.test(entry.name)) {
					results.push(path.relative(root, entryPath).split(path.sep).join('/'));
				}
			}),
		);
	}

	await visit(root);
	return results;
}

async function main() {
	const includeGlobs = getIncludeGlobs(vitestConfig);
	if (includeGlobs.length === 0) {
		throw new Error(
			'Could not read any `test.projects[].test.include` globs from vitest.config.ts. ' +
				'Did its shape change? Update scripts/check-test-suffixes.ts to match.',
		);
	}

	const testFiles = await collectTestFiles(packageRoot);
	const strays = findStrayTestFiles(testFiles, includeGlobs);

	if (strays.length > 0) {
		// oxlint-disable-next-line no-console
		console.error(
			[
				'The following test files use a suffix that no Vitest project runs (see `test.include` in vitest.config.ts), so they silently never execute:',
				...strays.map((file) => `  - ${file}`),
				'',
				'Rename each file to one of the recognized suffixes:',
				'  - `.browser.test.tsx` — component tests that run in a real browser',
				'  - `.visual.test.tsx` — visual regression captures',
				'  - `.test.ts` — pure Node/logic tests (plain TypeScript, no JSX)',
			].join('\n'),
		);
		process.exitCode = 1;
		return;
	}

	// oxlint-disable-next-line no-console
	console.log(`check:test-suffixes: ${testFiles.length} test file(s) all match a Vitest project.`);
}

await main();
