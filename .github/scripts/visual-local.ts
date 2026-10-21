// Local CI-parity visual captures. Runs the pinned Playwright image on linux/amd64
// without rewriting the host node_modules. Subcommands mirror the package scripts:
//   capture — write baseline screenshots (explicit)
//   compare — fetch the newest main baseline, then capture and compare

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdir, readdir, rename, rm } from 'node:fs/promises';
import {
	PLAYWRIGHT_BROWSERS_PATH,
	PLAYWRIGHT_VISUAL_IMAGE,
	PLAYWRIGHT_VISUAL_PLATFORM,
	VISUAL_ARTIFACTS_DIR,
	VISUAL_BASELINE_DIR,
} from '../../packages/@luke-ui/react/scripts/visual-regression-contract.js';
import { decideBaselineRun } from './visual-ci.js';
import type { BaselineRun } from './visual-ci.js';

export type VisualLocalCommand = 'capture' | 'compare';

export type VisualLocalDockerOptions = {
	artifactsDir: string;
	command: VisualLocalCommand;
	hostGid?: number;
	hostUid?: number;
	image?: string;
	platform?: string;
	repoRoot: string;
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const USAGE = 'Usage: visual-local <capture|compare>';

const DOCKER_MISSING = [
	'Docker is not available on PATH.',
	'Install Docker (or a compatible engine) that can run linux/amd64 images,',
	'then retry. On Apple Silicon that uses emulation.',
].join('\n');

/** Restores host ownership of bind-mounted artefacts written as root in the container. */
export function artifactOwnershipCleanup(): string {
	return [
		'if [ -n "${HOST_UID:-}" ] && [ -n "${HOST_GID:-}" ]; then',
		'  chown -R "$HOST_UID:$HOST_GID" /artifacts',
		'fi',
	].join('\n');
}

function indent(script: string, spaces: string): string {
	return script
		.split('\n')
		.map((line) => (line === '' ? line : `${spaces}${line}`))
		.join('\n');
}

/** Shell body run inside the Playwright container after the tree is copied to /work. */
export function containerCommand(command: VisualLocalCommand): string {
	const ownership = artifactOwnershipCleanup();

	const captureOrCompare =
		command === 'capture'
			? [
					'capture_dir=$(mktemp -d /artifacts/baseline.XXXXXX)',
					'cleanup() {',
					'  if [ -n "${capture_dir:-}" ]; then',
					'    rm -rf "$capture_dir"',
					'  fi',
					indent(ownership, '  '),
					'}',
					'trap cleanup EXIT',
					'VISUAL_CAPTURE_DIR="$capture_dir" pnpm --filter @luke-ui/react run test:visual:capture',
					// A successful empty run must not replace a valid baseline.
					'if [ -z "$(find "$capture_dir" -type f -name \'*.png\' -print -quit)" ]; then',
					'  echo "No PNG screenshots were written, so the existing baseline was left unchanged." >&2',
					'  echo "Check the capture output above." >&2',
					'  exit 1',
					'fi',
					'rm -rf /artifacts/baseline',
					'mv "$capture_dir" /artifacts/baseline',
					'capture_dir=',
				].join('\n')
			: [
					'cleanup() {',
					indent(ownership, '  '),
					'}',
					'trap cleanup EXIT',
					'pnpm --filter @luke-ui/react run test:visual:run',
				].join('\n');

	return [
		'set -euo pipefail',
		'mkdir -p /work',
		'tar -C /src --exclude=node_modules --exclude=.git --exclude=.artifacts --exclude=dist --exclude=.turbo --exclude=.source --exclude=.generated --exclude=.vite --exclude=.output --exclude=.cache --exclude=.vinxi --exclude=.tanstack --exclude=apps/docs/src/generated --exclude=apps/docs/src/routeTree.gen.ts --exclude=packages/@luke-ui/react/src/generated --exclude=packages/@luke-ui/react/public/icons --exclude=packages/@luke-ui/react/spritesheet.svg -cf - . | tar -C /work -xf -',
		'cd /work',
		'mkdir -p /work/.artifacts',
		'ln -sfn /artifacts /work/.artifacts/visual-regression',
		'corepack enable',
		'PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 pnpm install --frozen-lockfile --no-runtime',
		'pnpm build:packages',
		captureOrCompare,
	].join('\n');
}

/** Host uid/gid for artefact chown. Omitted when the platform has no getuid (for example Windows). */
export function hostUserEnv(): { gid: number; uid: number } | undefined {
	if (typeof process.getuid !== 'function' || typeof process.getgid !== 'function') {
		return undefined;
	}
	return { gid: process.getgid(), uid: process.getuid() };
}

/** `docker run` argv (no binary name). Host paths are separate args so spaces stay intact. */
export function buildDockerRunArgs(options: VisualLocalDockerOptions): Array<string> {
	const image = options.image ?? PLAYWRIGHT_VISUAL_IMAGE;
	const platform = options.platform ?? PLAYWRIGHT_VISUAL_PLATFORM;
	const hostUser =
		options.hostUid !== undefined && options.hostGid !== undefined
			? { gid: options.hostGid, uid: options.hostUid }
			: hostUserEnv();

	const args = [
		'run',
		'--rm',
		'--ipc=host',
		'--platform',
		platform,
		'-e',
		`PLAYWRIGHT_BROWSERS_PATH=${PLAYWRIGHT_BROWSERS_PATH}`,
	];

	if (hostUser !== undefined) {
		args.push('-e', `HOST_UID=${hostUser.uid}`, '-e', `HOST_GID=${hostUser.gid}`);
	}

	args.push(
		'-v',
		`${options.repoRoot}:/src:ro`,
		'-v',
		`${options.artifactsDir}:/artifacts`,
		'-v',
		'luke-ui-visual-pnpm-store:/root/.local/share/pnpm/store',
		image,
		'bash',
		'-lc',
		containerCommand(options.command),
	);

	return args;
}

export function isDockerMissingError(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		(error as { code?: unknown }).code === 'ENOENT'
	);
}

export function dockerExitStatus(error: unknown): number | undefined {
	if (typeof error !== 'object' || error === null || !('status' in error)) return undefined;
	const status = (error as { status?: unknown }).status;
	return typeof status === 'number' ? status : undefined;
}

async function hasPngs(directory: string): Promise<boolean> {
	const entries = await readdir(directory, { recursive: true, withFileTypes: true }).catch(
		() => [],
	);
	return entries.some((entry) => entry.isFile() && entry.name.endsWith('.png'));
}

function fail(message: string): never {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function info(message: string) {
	process.stdout.write(`${message}\n`);
}

function runDocker(args: Array<string>) {
	try {
		execFileSync('docker', args, { stdio: 'inherit' });
	} catch (error) {
		if (isDockerMissingError(error)) {
			fail(DOCKER_MISSING);
		}
		const status = dockerExitStatus(error);
		process.exit(status === undefined || status === 0 ? 1 : status);
	}
}

export async function downloadAuthoritativeBaseline(options: {
	run: BaselineRun | undefined;
	baselineDir: string;
	download: (runId: number, directory: string) => Promise<void>;
}): Promise<{ runId: number; runAttempt: number }> {
	const decision = decideBaselineRun(
		options.run,
		(id) => `https://github.com/lukebennett88/luke-ui/actions/runs/${id}`,
	);
	if (!decision.ok) throw new Error(decision.reason);
	const temporary = `${options.baselineDir}.download-${process.pid}`;
	await rm(temporary, { recursive: true, force: true });
	await mkdir(temporary, { recursive: true });
	try {
		await options.download(decision.runId, temporary);
		if (!(await hasPngs(temporary)))
			throw new Error('The newest main baseline artifact contains no PNG screenshots.');
		await rm(options.baselineDir, { recursive: true, force: true });
		await rename(temporary, options.baselineDir);
	} finally {
		await rm(temporary, { recursive: true, force: true });
	}
	return { runId: decision.runId, runAttempt: decision.runAttempt };
}

async function downloadNewestBaseline(baselineDir: string) {
	const repository = 'lukebennett88/luke-ui';
	const response = JSON.parse(
		execFileSync(
			'gh',
			[
				'api',
				`repos/${repository}/actions/workflows/visual-baseline.yml/runs?branch=main&per_page=1`,
			],
			{ encoding: 'utf8' },
		),
	) as { workflow_runs: Array<BaselineRun> };
	const selected = await downloadAuthoritativeBaseline({
		run: response.workflow_runs[0],
		baselineDir,
		async download(id, directory) {
			execFileSync(
				'gh',
				[
					'run',
					'download',
					String(id),
					'--repo',
					repository,
					'--name',
					'visual-baseline',
					'--dir',
					directory,
				],
				{ stdio: 'inherit' },
			);
		},
	});
	info(
		`Authoritative main baseline: workflow run ${selected.runId}, attempt ${selected.runAttempt}.`,
	);
}

async function main(command: VisualLocalCommand) {
	const artifactsDir = path.join(repoRoot, ...VISUAL_ARTIFACTS_DIR.split('/'));
	const baselineDir = path.join(repoRoot, ...VISUAL_BASELINE_DIR.split('/'));

	await mkdir(artifactsDir, { recursive: true });

	runDocker(['info', '--format', '{{.ServerVersion}}']);
	if (command === 'compare') await downloadNewestBaseline(baselineDir);

	if (command === 'capture') {
		info(
			`Writing baseline screenshots to ${baselineDir} via ${PLAYWRIGHT_VISUAL_IMAGE} (${PLAYWRIGHT_VISUAL_PLATFORM}).`,
		);
	} else {
		info(
			`Comparing against ${baselineDir} via ${PLAYWRIGHT_VISUAL_IMAGE} (${PLAYWRIGHT_VISUAL_PLATFORM}). Baseline is not modified.`,
		);
	}

	runDocker(
		buildDockerRunArgs({
			artifactsDir,
			command,
			repoRoot,
		}),
	);
}

const entry = process.argv[1];
const isCli = entry !== undefined && import.meta.url === pathToFileURL(path.resolve(entry)).href;

if (isCli) {
	const command = process.argv.slice(2).find((arg) => arg !== '--');

	switch (command) {
		case 'capture':
		case 'compare':
			await main(command);
			break;
		case undefined:
			fail(USAGE);
			break;
		default:
			fail(`Unknown command: ${command}\n${USAGE}`);
	}
}
