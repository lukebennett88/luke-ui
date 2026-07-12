import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { arch, platform } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { compareCaptures, renderReport, validateCaptureIds } from './visual-regression-lib.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(packageRoot, '../../..');
const artifacts = path.join(repoRoot, '.artifacts/visual-regression');

async function main() {
	const configuredBaseSha = process.env.VISUAL_BASE_SHA?.trim();
	const baseRef = process.env.VISUAL_BASE_REF?.trim() || 'origin/main';
	const baseSha = configuredBaseSha || output(['rev-parse', baseRef]);
	const current = process.env.GITHUB_SHA ?? 'working tree';
	const signature = createHash('sha256')
		.update(await readFile(path.join(repoRoot, 'pnpm-lock.yaml')))
		.update(await readFile(path.join(packageRoot, 'vitest.config.ts')))
		.digest('hex')
		.slice(0, 12);
	const cache = path.join(
		artifacts,
		'cache',
		`${baseSha}-${platform()}-${arch()}-chromium-${signature}`,
	);
	const baseCaptures = path.join(cache, 'captures');
	const currentCaptures = path.join(artifacts, 'current');
	const worktree = path.join(artifacts, 'worktree');

	try {
		await readFile(path.join(cache, 'complete'));
	} catch {
		await rm(worktree, { force: true, recursive: true });
		run('git', ['worktree', 'add', '--detach', worktree, baseSha]);
		try {
			await capture(worktree, baseCaptures);
			await writeFile(path.join(cache, 'complete'), '');
		} finally {
			run('git', ['worktree', 'remove', '--force', worktree]);
		}
	}

	await capture(repoRoot, currentCaptures);
	const reportDir = path.join(artifacts, 'report');
	const results = await compareCaptures(
		baseCaptures,
		currentCaptures,
		path.join(reportDir, 'diffs'),
	);
	const counts = await renderReport(
		results,
		{ base: baseSha, current, platform: `${platform()} ${arch()} Chromium` },
		path.join(reportDir, 'index.html'),
	);
	await writeFile(
		path.join(reportDir, 'summary.json'),
		JSON.stringify({ counts, results }, null, 2),
	);
	// CLI output is the entry point to the generated report.
	// oxlint-disable-next-line no-console
	console.log(`Visual report: ${path.join(reportDir, 'index.html')}`);
	// oxlint-disable-next-line no-console
	console.log(`${counts.changed} changed, ${counts.added} added, ${counts.removed} removed`);
}

async function capture(worktree: string, target: string) {
	if (worktree !== repoRoot) {
		await copyFile(
			path.join(packageRoot, 'vitest.config.ts'),
			path.join(worktree, 'packages/@luke-ui/react/vitest.config.ts'),
		);
	}
	await validateCaptureIds(path.join(worktree, 'packages/@luke-ui/react/src'));
	await rm(target, { force: true, recursive: true });
	await mkdir(target, { recursive: true });
	if (worktree !== repoRoot) {
		run('corepack', ['pnpm', 'install', '--frozen-lockfile'], worktree);
	}
	run('corepack', ['pnpm', 'build:packages'], worktree);
	run(
		'corepack',
		[
			'pnpm',
			'--filter',
			'@luke-ui/react',
			'exec',
			'vp',
			'test',
			'run',
			'--project=visual',
			'--update',
		],
		worktree,
		{ ...process.env, VISUAL_CAPTURE_DIR: target },
	);
}

function run(command: string, args: Array<string>, cwd = repoRoot, env = process.env) {
	return execFileSync(command, args, { cwd, env, stdio: 'inherit' });
}

function output(args: Array<string>, cwd = repoRoot) {
	return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

await main();
