import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import {
	VISUAL_BASELINE_DIR,
	VISUAL_CAPTURE_DIR_ENV,
	VISUAL_CURRENT_DIR,
	VISUAL_DIFF_DIR,
	VISUAL_SUMMARY_FILE,
	visualPackageRoot,
	visualRepoRootFromPackage,
} from './visual-regression-contract.js';
import { assertCapturesPainted, compareCaptures, countResults } from './visual-regression-lib.js';

const BASELINE_MISSING = [
	'No visual baseline found.',
	'Run "Visual baseline" on `main`, or capture one locally:',
	'',
	`  VISUAL_CAPTURE_DIR=${VISUAL_BASELINE_DIR} pnpm --filter @luke-ui/react run test:visual:capture`,
].join('\n');

const packageRoot = visualPackageRoot(import.meta.url);
const repoRoot = visualRepoRootFromPackage(packageRoot);

const baselineDir = resolveDir(process.env.VISUAL_BASELINE_DIR, VISUAL_BASELINE_DIR);
const currentDir = resolveDir(process.env.VISUAL_CAPTURE_DIR, VISUAL_CURRENT_DIR);
const diffDir = path.join(repoRoot, ...VISUAL_DIFF_DIR.split('/'));
const summaryFile = path.join(repoRoot, ...VISUAL_SUMMARY_FILE.split('/'));

if (!(await hasPngs(baselineDir))) throw new Error(BASELINE_MISSING);

await captureCurrent();
await assertCapturesPainted(currentDir);

await rm(diffDir, { force: true, recursive: true });
const results = await compareCaptures(baselineDir, currentDir, diffDir);
const counts = countResults(results);
await mkdir(path.dirname(summaryFile), { recursive: true });
await writeFile(summaryFile, `${JSON.stringify({ counts, results }, null, 2)}\n`);

const review = counts.changed + counts.added + counts.removed;
log(
	`${counts.changed} changed, ${counts.added} added, ${counts.removed} removed, ${counts.unchanged} unchanged`,
);
log(review > 0 ? `Expected/actual/diff PNGs: ${diffDir}` : 'No visual changes.');

async function captureCurrent() {
	await rm(currentDir, { force: true, recursive: true });
	await mkdir(currentDir, { recursive: true });
	execFileSync(
		'pnpm',
		['exec', 'vp', 'test', 'run', '--project=browser', "--tagsFilter='visual'", '--update'],
		{
			cwd: packageRoot,
			env: { ...process.env, [VISUAL_CAPTURE_DIR_ENV]: currentDir },
			stdio: 'inherit',
		},
	);
}

function resolveDir(configured: string | undefined, fallback: string) {
	const trimmed = configured?.trim();
	return trimmed ? path.resolve(trimmed) : path.join(repoRoot, ...fallback.split('/'));
}

async function hasPngs(directory: string): Promise<boolean> {
	const entries = await readdir(directory, { recursive: true, withFileTypes: true }).catch(
		() => [],
	);
	return entries.some((entry) => entry.isFile() && entry.name.endsWith('.png'));
}

function log(message: string) {
	// oxlint-disable-next-line no-console
	console.log(message);
}
