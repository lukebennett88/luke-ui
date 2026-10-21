// Local CI-parity visual captures. Runs the pinned Playwright image on linux/amd64
// without rewriting the host node_modules. Subcommands mirror the package scripts:
//   capture — write baseline screenshots (explicit)
//   compare — fetch the newest main baseline, then capture and compare

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { cp, mkdir, readdir, rename, rm, stat } from 'node:fs/promises';
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
		dependencyInstallCommand(),
		'pnpm build:packages',
		captureOrCompare,
	].join('\n');
}

// Hash install inputs before generation or build can write anything into the tree.
function dependencyInstallCommand(): string {
	const install = 'PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 pnpm install --frozen-lockfile --no-runtime';
	const keyScript = [
		'const { createHash } = require("node:crypto");',
		'const fs = require("node:fs");',
		'const path = require("node:path");',
		'const hash = createHash("sha256");',
		`hash.update(JSON.stringify(["v1", process.env.VISUAL_INSTALL_IMAGE, process.env.VISUAL_INSTALL_PLATFORM, process.platform, process.arch, "${install}"]));`,
		'const inputs = new Set(["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", ".npmrc", ".pnpmfile.cjs", ".pnpmfile.mjs", "pnpmfile.cjs", "pnpmfile.mjs"]);',
		'function visit(directory, isPatch = false) {',
		'  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {',
		'    const file = path.join(directory, entry.name);',
		'    const patch = isPatch || entry.name === "patches";',
		'    if (entry.isDirectory()) visit(file, patch);',
		'    else if (entry.isFile() && (patch || inputs.has(entry.name))) {',
		'      hash.update(file); hash.update("\\0"); hash.update(fs.readFileSync(file)); hash.update("\\0");',
		'    }',
		'  }',
		'}',
		'visit(".");',
		'process.stdout.write(hash.digest("hex"));',
	].join('\n');

	return [
		`dependency_key=$(node -e '${keyScript}')`,
		'mkdir -p /cache',
		'dependency_archive="/cache/$dependency_key.tar"',
		'dependencies_restored=',
		'if [ -f "$dependency_archive" ]; then',
		'  if tar -xf "$dependency_archive" && [ -d node_modules ]; then',
		'    dependencies_restored=1',
		'    echo "Reusing Docker dependency install $dependency_key."',
		'  else',
		'    rm -f "$dependency_archive"',
		'    find . -type d -name node_modules -prune -exec rm -rf {} +',
		'  fi',
		'fi',
		'if [ -z "$dependencies_restored" ]; then',
		'  echo "Installing Docker dependencies for $dependency_key."',
		`  ${install}`,
		'  dependency_temporary=$(mktemp /cache/dependencies.XXXXXX)',
		'  if find . -type d -name node_modules -prune -print0 | tar --null -T - -cf "$dependency_temporary"; then',
		'    mv "$dependency_temporary" "$dependency_archive"',
		'  else',
		'    rm -f "$dependency_temporary"',
		'    exit 1',
		'  fi',
		'fi',
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
		'-e',
		`VISUAL_INSTALL_IMAGE=${image}`,
		'-e',
		`VISUAL_INSTALL_PLATFORM=${platform}`,
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
		'-v',
		'luke-ui-visual-dependencies:/cache',
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
	const pngFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.png'));
	const metadata = await Promise.all(
		pngFiles.map((entry) => stat(path.join(entry.parentPath, entry.name))),
	);
	return metadata.some((file) => file.size > 0);
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
	const cache = path.join(
		`${options.baselineDir}.cache`,
		`${decision.runId}-${decision.runAttempt}`,
	);
	const temporary = `${options.baselineDir}.download-${process.pid}`;
	await rm(temporary, { recursive: true, force: true });
	try {
		if (!(await hasPngs(cache))) {
			await mkdir(temporary, { recursive: true });
			info(
				`Downloading main baseline: workflow run ${decision.runId}, attempt ${decision.runAttempt}.`,
			);
			await options.download(decision.runId, temporary);
			if (!(await hasPngs(temporary)))
				throw new Error('The newest main baseline artifact contains no PNG screenshots.');
			await mkdir(path.dirname(cache), { recursive: true });
			await rm(cache, { recursive: true, force: true });
			await rename(temporary, cache);
		} else {
			info(
				`Reusing main baseline: workflow run ${decision.runId}, attempt ${decision.runAttempt}.`,
			);
		}
		// Keep explicit local captures separate from the authoritative cache.
		await cp(cache, temporary, { recursive: true });
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
