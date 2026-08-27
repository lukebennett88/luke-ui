import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { arch, platform } from 'node:os';
import path from 'node:path';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import {
	VISUAL_CACHE_HASH_FILES,
	VISUAL_CAPTURE_DIR_ENV,
	VISUAL_HARNESS_FILES,
	VISUAL_HARNESS_LAYOUT_FILE,
	visualArtifactsRoot,
	visualPackageRoot,
	visualRepoRootFromPackage,
} from './visual-regression-contract.js';
import { assertCapturesPainted, compareCaptures, renderReport } from './visual-regression-lib.js';

export type VisualRegressionIo = {
	arch: string;
	copyFile: (source: string, destination: string) => Promise<void>;
	env: NodeJS.ProcessEnv;
	gitOutput: (args: Array<string>, cwd?: string) => string;
	log: (message: string) => void;
	mkdir: (directory: string, options?: { recursive?: boolean }) => Promise<string | undefined>;
	platform: string;
	readFile: (file: string) => Promise<Buffer>;
	repoRoot: string;
	rm: (target: string, options?: { force?: boolean; recursive?: boolean }) => Promise<void>;
	run: (command: string, args: Array<string>, cwd?: string, env?: NodeJS.ProcessEnv) => void;
	writeFile: (file: string, data: string) => Promise<void>;
};

function createVisualRegressionIo(): VisualRegressionIo {
	const repoRoot = visualRepoRootFromPackage(visualPackageRoot(import.meta.url));
	return {
		arch: arch(),
		copyFile,
		env: process.env,
		gitOutput: (args, cwd = repoRoot) => {
			return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
		},
		log: (message) => {
			// CLI output is the entry point to the generated report.
			// oxlint-disable-next-line no-console
			console.log(message);
		},
		mkdir,
		platform: platform(),
		readFile,
		repoRoot,
		rm,
		run: (command, args, cwd = repoRoot, env = process.env) => {
			execFileSync(command, args, { cwd, env, stdio: 'inherit' });
		},
		writeFile,
	};
}

export async function visualCacheSignature(
	repoRoot: string,
	read: VisualRegressionIo['readFile'],
): Promise<string> {
	const hashedFiles = await Promise.all(
		VISUAL_CACHE_HASH_FILES.map((file) => read(path.join(repoRoot, file))),
	);
	const hash = createHash('sha256');
	for (const contents of hashedFiles) hash.update(contents);
	return hash.digest('hex').slice(0, 12);
}

export function visualCacheDirectory(
	artifacts: string,
	baseSha: string,
	platformName: string,
	archName: string,
	signature: string,
): string {
	return path.join(
		artifacts,
		'cache',
		`${baseSha}-${platformName}-${archName}-chromium-${signature}`,
	);
}

export async function runVisualRegression(io: VisualRegressionIo = createVisualRegressionIo()) {
	const artifacts = visualArtifactsRoot(io.repoRoot);
	const configuredBaseSha = io.env.VISUAL_BASE_SHA?.trim();
	const baseRef = io.env.VISUAL_BASE_REF?.trim() || 'origin/main';
	const baseSha = configuredBaseSha || io.gitOutput(['rev-parse', baseRef]);
	const current = io.env.GITHUB_SHA ?? 'working tree';
	const signature = await visualCacheSignature(io.repoRoot, io.readFile);
	const cache = visualCacheDirectory(artifacts, baseSha, io.platform, io.arch, signature);
	const baseCaptures = path.join(cache, 'captures');
	const currentCaptures = path.join(artifacts, 'current');
	const worktree = path.join(artifacts, 'worktree');

	try {
		await io.readFile(path.join(cache, 'complete'));
	} catch {
		await io.rm(worktree, { force: true, recursive: true });
		io.run('git', ['worktree', 'add', '--detach', worktree, baseSha]);
		try {
			await capture(io, worktree, baseCaptures);
			await io.writeFile(path.join(cache, 'complete'), '');
		} finally {
			io.run('git', ['worktree', 'remove', '--force', worktree]);
		}
	}

	await capture(io, io.repoRoot, currentCaptures);
	// Guard against unpainted tall captures only on the current tree. The base is
	// whatever origin/main produced and cannot be fixed retroactively; a stale base
	// must not block the current tree's comparison.
	await assertCapturesPainted(currentCaptures);
	const reportDir = path.join(artifacts, 'report');
	const results = await compareCaptures(
		baseCaptures,
		currentCaptures,
		path.join(reportDir, 'diffs'),
	);
	const counts = await renderReport(
		results,
		{ base: baseSha, current, platform: `${io.platform} ${io.arch} Chromium` },
		path.join(reportDir, 'index.html'),
	);
	await io.writeFile(
		path.join(reportDir, 'summary.json'),
		JSON.stringify({ counts, results }, null, 2),
	);
	io.log(`Visual report: ${path.join(reportDir, 'index.html')}`);
	io.log(`${counts.changed} changed, ${counts.added} added, ${counts.removed} removed`);
}

async function capture(io: VisualRegressionIo, worktree: string, target: string) {
	if (worktree !== io.repoRoot && (await hasCurrentVisualHarnessLayout(io, worktree))) {
		await Promise.all(
			VISUAL_HARNESS_FILES.map(async (file) => {
				const destination = path.join(worktree, file);
				await io.mkdir(path.dirname(destination), { recursive: true });
				await io.copyFile(path.join(io.repoRoot, file), destination);
			}),
		);
	}
	await io.rm(target, { force: true, recursive: true });
	await io.mkdir(target, { recursive: true });
	if (worktree !== io.repoRoot) {
		io.run('corepack', ['pnpm', 'install', '--frozen-lockfile'], worktree);
		io.run(
			'corepack',
			['pnpm', '--filter', '@luke-ui/react', 'exec', 'playwright', 'install', 'chromium'],
			worktree,
		);
	}
	io.run('corepack', ['pnpm', 'build:packages'], worktree);
	io.run(
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
		{ ...io.env, [VISUAL_CAPTURE_DIR_ENV]: target },
	);
}

async function hasCurrentVisualHarnessLayout(
	io: VisualRegressionIo,
	worktree: string,
): Promise<boolean> {
	try {
		await io.readFile(path.join(worktree, VISUAL_HARNESS_LAYOUT_FILE));
		return true;
	} catch {
		return false;
	}
}
