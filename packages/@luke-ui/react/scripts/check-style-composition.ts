import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir, readFile } from 'node:fs/promises';
import { findStyleCompositionViolations } from './check-style-composition-lib.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const componentsRoot = path.join(packageRoot, 'src', 'core');
const ignoredDirNames = new Set([
	'node_modules',
	'dist',
	'.turbo',
	'.generated',
	'storybook-static',
]);
// The helper implementations themselves legitimately contain these constructs — they are what
// component sources should call instead of hand-rolling the merge.
const ignoredRelativePaths = new Set([
	path.join('styles', 'xstyle.ts'),
	path.join('styles', 'recipe-authoring.ts'),
]);
const COMPONENT_FILE_PATTERN = /\.tsx$/;
const TEST_OR_STORY_FILE_PATTERN = /\.(?:test|stories)\.tsx$/;

async function collectComponentFiles(root: string): Promise<Array<string>> {
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
				if (!COMPONENT_FILE_PATTERN.test(entry.name)) return;
				if (TEST_OR_STORY_FILE_PATTERN.test(entry.name)) return;
				const relativePath = path.relative(root, entryPath);
				if (ignoredRelativePaths.has(relativePath)) return;
				results.push(entryPath);
			}),
		);
	}

	await visit(root);
	return results;
}

async function main() {
	const componentFiles = await collectComponentFiles(componentsRoot);
	const files = await Promise.all(
		componentFiles.map(async (file) => ({ file, source: await readFile(file, 'utf8') })),
	);

	const violations = findStyleCompositionViolations(files);

	if (violations.length > 0) {
		// oxlint-disable-next-line no-console
		console.error('Hand-rolled recipe className/style recomposition found:');
		for (const violation of violations) {
			// oxlint-disable-next-line no-console
			console.error(
				`  ${path.relative(packageRoot, violation.file)}:${violation.line} — ${violation.message}`,
			);
		}
		process.exitCode = 1;
		return;
	}

	// oxlint-disable-next-line no-console
	console.log(
		`check:style-composition: ${componentFiles.length} component file(s) compose recipe styles through the shared helpers.`,
	);
}

await main();
