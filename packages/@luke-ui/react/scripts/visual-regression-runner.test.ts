import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import { expect, test } from 'vite-plus/test';
import {
	VISUAL_CACHE_HASH_FILES,
	VISUAL_CAPTURE_DIR_ENV,
	visualArtifactsRoot,
} from './visual-regression-contract.js';
import type { VisualRegressionIo } from './visual-regression-runner.js';
import {
	runVisualRegression,
	visualCacheDirectory,
	visualCacheSignature,
} from './visual-regression-runner.js';

type CommandCall = {
	args: Array<string>;
	command: string;
	cwd?: string;
};

async function fakeRepo() {
	const repoRoot = await mkdtemp(path.join(tmpdir(), 'visual-lifecycle-'));
	await Promise.all(
		VISUAL_CACHE_HASH_FILES.map(async (file) => {
			const destination = path.join(repoRoot, file);
			await mkdir(path.dirname(destination), { recursive: true });
			await writeFile(destination, `${file}\n`);
		}),
	);
	return repoRoot;
}

function createIo(
	repoRoot: string,
	run: VisualRegressionIo['run'],
	overrides?: Partial<VisualRegressionIo>,
): VisualRegressionIo {
	return {
		arch: 'x64',
		copyFile,
		env: { VISUAL_BASE_SHA: 'abc123' },
		gitOutput: () => 'abc123',
		log: () => {},
		mkdir,
		platform: 'linux',
		readFile,
		repoRoot,
		rm,
		run,
		writeFile,
		...overrides,
	};
}

function worktreeCalls(calls: Array<CommandCall>) {
	return calls.filter((call) => call.command === 'git' && call.args[0] === 'worktree');
}

function png() {
	const image = new PNG({ height: 1, width: 1 });
	image.data[3] = 255;
	return PNG.sync.write(image);
}

test('cache hit skips the base capture and does not create a worktree', async () => {
	const repoRoot = await fakeRepo();
	const artifacts = visualArtifactsRoot(repoRoot);
	const signature = await visualCacheSignature(repoRoot, readFile);
	const cache = visualCacheDirectory(artifacts, 'abc123', 'linux', 'x64', signature);
	const baseCaptures = path.join(cache, 'captures');
	const image = png();
	await mkdir(baseCaptures, { recursive: true });
	await writeFile(path.join(cache, 'complete'), '');
	await writeFile(path.join(baseCaptures, 'scene.png'), image);

	const calls: Array<CommandCall> = [];
	await runVisualRegression(
		createIo(repoRoot, (command, args, cwd, env) => {
			calls.push({ args, command, cwd });
			const captureDir = env?.[VISUAL_CAPTURE_DIR_ENV];
			if (captureDir === undefined || captureDir === '') return;
			if (!args.includes('--project=visual')) return;
			writeFileSync(path.join(captureDir, 'scene.png'), image);
		}),
	);

	expect(worktreeCalls(calls)).toEqual([]);
	expect(calls.some((call) => call.cwd === path.join(artifacts, 'worktree'))).toBe(false);
	expect(
		calls.some(
			(call) =>
				call.command === 'corepack' &&
				call.args.includes('build:packages') &&
				call.cwd === repoRoot,
		),
	).toBe(true);

	const summary: { counts: { added: number; removed: number; unchanged: number } } = JSON.parse(
		await readFile(path.join(artifacts, 'report', 'summary.json'), 'utf8'),
	);
	expect(summary.counts.added).toBe(0);
	expect(summary.counts.removed).toBe(0);
	expect(summary.counts.unchanged).toBe(1);
});

test('cache miss creates and removes the base worktree', async () => {
	const repoRoot = await fakeRepo();
	const worktree = path.join(visualArtifactsRoot(repoRoot), 'worktree');
	const calls: Array<CommandCall> = [];

	await runVisualRegression(
		createIo(repoRoot, (command, args, cwd) => {
			calls.push({ args, command, cwd });
		}),
	);

	expect(worktreeCalls(calls)).toEqual([
		{ args: ['worktree', 'add', '--detach', worktree, 'abc123'], command: 'git', cwd: undefined },
		{ args: ['worktree', 'remove', '--force', worktree], command: 'git', cwd: undefined },
	]);
	expect(calls.some((call) => call.command === 'corepack' && call.cwd === worktree)).toBe(true);
	expect(
		calls.some(
			(call) =>
				call.command === 'corepack' &&
				call.args.includes('build:packages') &&
				call.cwd === repoRoot,
		),
	).toBe(true);
});

test('removes the base worktree when capture throws', async () => {
	const repoRoot = await fakeRepo();
	const worktree = path.join(visualArtifactsRoot(repoRoot), 'worktree');
	const calls: Array<CommandCall> = [];

	await expect(
		runVisualRegression(
			createIo(repoRoot, (command, args, cwd) => {
				calls.push({ args, command, cwd });
				if (command === 'corepack' && cwd === worktree) {
					throw new Error('capture failed');
				}
			}),
		),
	).rejects.toThrow('capture failed');

	expect(worktreeCalls(calls)).toEqual([
		{ args: ['worktree', 'add', '--detach', worktree, 'abc123'], command: 'git', cwd: undefined },
		{ args: ['worktree', 'remove', '--force', worktree], command: 'git', cwd: undefined },
	]);
	expect(
		calls.some(
			(call) =>
				call.command === 'corepack' &&
				call.args.includes('build:packages') &&
				call.cwd === repoRoot,
		),
	).toBe(false);
});
