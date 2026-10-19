import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';
import {
	PLAYWRIGHT_BROWSERS_PATH,
	PLAYWRIGHT_VISUAL_IMAGE,
	PLAYWRIGHT_VISUAL_PLATFORM,
} from '../../packages/@luke-ui/react/scripts/visual-regression-contract.js';
import {
	artifactOwnershipCleanup,
	buildDockerRunArgs,
	containerCommand,
	dockerExitStatus,
	isDockerMissingError,
} from './visual-local.js';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptsDir, '../..');

async function runCaptureScript(options: {
	artifacts: string;
	bin: string;
	pnpmBody: string;
	root: string;
}): Promise<number> {
	const stubBodies: Record<string, string> = {
		chown: '#!/bin/sh\nexit 0\n',
		corepack: '#!/bin/sh\nexit 0\n',
		find: `#!/bin/sh
# Enough of find for: find DIR -type f -name '*.png' -print -quit
dir="$1"
shift
for arg in "$@"; do
  case "$arg" in
    *.png)
      for path in "$dir"/*.png "$dir"/*/*.png; do
        if [ -f "$path" ]; then
          printf '%s\\n' "$path"
          exit 0
        fi
      done
      exit 0
      ;;
  esac
done
exit 0
`,
		pnpm: `#!/bin/sh\n${options.pnpmBody}`,
		tar: '#!/bin/sh\nexit 0\n',
	};

	await Promise.all(
		Object.entries(stubBodies).map(([command, body]) =>
			writeFile(path.join(options.bin, command), body, { mode: 0o755 }),
		),
	);

	const script = containerCommand('capture')
		.replaceAll('/work', path.join(options.root, 'work'))
		.replaceAll('/src', path.join(options.root, 'src'))
		.replaceAll('/artifacts', options.artifacts);

	try {
		execFileSync('bash', ['-c', script], {
			env: {
				...process.env,
				HOST_GID: '20',
				HOST_UID: '501',
				PATH: `${options.bin}:${process.env.PATH}`,
			},
			stdio: 'pipe',
		});
		return 0;
	} catch (error) {
		return dockerExitStatus(error) ?? -1;
	}
}

test('docker args pin amd64, the contract image, browser path, and host ownership env', () => {
	const artifactsDir = path.join(repoRoot, '.artifacts', 'visual-regression');
	const args = buildDockerRunArgs({
		artifactsDir,
		command: 'compare',
		hostGid: 20,
		hostUid: 501,
		repoRoot,
	});

	expect(args).toEqual([
		'run',
		'--rm',
		'--ipc=host',
		'--platform',
		PLAYWRIGHT_VISUAL_PLATFORM,
		'-e',
		`PLAYWRIGHT_BROWSERS_PATH=${PLAYWRIGHT_BROWSERS_PATH}`,
		'-e',
		'HOST_UID=501',
		'-e',
		'HOST_GID=20',
		'-v',
		`${repoRoot}:/src:ro`,
		'-v',
		`${artifactsDir}:/artifacts`,
		PLAYWRIGHT_VISUAL_IMAGE,
		'bash',
		'-lc',
		containerCommand('compare'),
	]);
});

test('keeps host paths with spaces as single -v arguments', () => {
	const spacedRoot = '/tmp/luke ui repo';
	const spacedArtifacts = '/tmp/luke ui repo/.artifacts/visual-regression';
	const args = buildDockerRunArgs({
		artifactsDir: spacedArtifacts,
		command: 'capture',
		hostGid: 20,
		hostUid: 501,
		repoRoot: spacedRoot,
	});

	expect(args).toContain(`${spacedRoot}:/src:ro`);
	expect(args).toContain(`${spacedArtifacts}:/artifacts`);
	expect(args.filter((arg) => arg.includes('luke ui'))).toHaveLength(2);
});

test('capture sets a capture directory; compare runs test:visual without that env', () => {
	expect(containerCommand('capture')).toContain('VISUAL_CAPTURE_DIR="$capture_dir"');
	expect(containerCommand('capture')).toContain('test:visual:capture');
	expect(containerCommand('capture')).toContain('find "$capture_dir" -type f -name \'*.png\'');
	expect(containerCommand('compare')).toContain('test:visual');
	expect(containerCommand('compare')).not.toContain('VISUAL_CAPTURE_DIR=');
	expect(containerCommand('compare')).not.toContain('test:visual:capture');
});

test('container worktree skips host node_modules and restores artefact ownership', () => {
	const body = containerCommand('capture');
	expect(body).toContain('--exclude=node_modules');
	expect(body).toContain('--exclude=.git');
	expect(body).toContain('--exclude=.artifacts');
	expect(body).toContain('ln -sfn /artifacts /work/.artifacts/visual-regression');
	expect(body).toContain('PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1');
	expect(body).toContain('chown -R "$HOST_UID:$HOST_GID" /artifacts');
	expect(containerCommand('compare')).toContain('chown -R "$HOST_UID:$HOST_GID" /artifacts');
	expect(artifactOwnershipCleanup()).toContain('chown -R "$HOST_UID:$HOST_GID" /artifacts');
});

for (const status of [0, 1]) {
	test(`capture with exit status ${status} ${status === 0 ? 'replaces' : 'preserves'} the baseline`, async () => {
		const root = await mkdtemp(path.join(tmpdir(), 'visual-local-'));
		const artifacts = path.join(root, 'artifacts');
		const baseline = path.join(artifacts, 'baseline');
		const bin = path.join(root, 'bin');

		try {
			await mkdir(baseline, { recursive: true });
			await mkdir(bin);
			await writeFile(path.join(baseline, 'obsolete.png'), 'previous screenshot');
			await writeFile(path.join(baseline, 'current.png'), 'previous current screenshot');

			const exitStatus = await runCaptureScript({
				artifacts,
				bin,
				pnpmBody: `if [ -n "\${VISUAL_CAPTURE_DIR:-}" ]; then
  mkdir -p "$VISUAL_CAPTURE_DIR"
  printf 'new screenshot' > "$VISUAL_CAPTURE_DIR/current.png"
  exit ${status}
fi
`,
				root,
			});

			expect(exitStatus).toBe(status);
			expect(await readdir(artifacts)).toEqual(['baseline']);
			const screenshots = await Promise.all(
				(await readdir(baseline))
					.sort()
					.map(async (file) => [file, await readFile(path.join(baseline, file), 'utf8')]),
			);
			expect(screenshots).toEqual(
				status === 0
					? [['current.png', 'new screenshot']]
					: [
							['current.png', 'previous current screenshot'],
							['obsolete.png', 'previous screenshot'],
						],
			);
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});
}

test('successful capture with no PNGs leaves the baseline unchanged', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-local-empty-'));
	const artifacts = path.join(root, 'artifacts');
	const baseline = path.join(artifacts, 'baseline');
	const bin = path.join(root, 'bin');

	try {
		await mkdir(baseline, { recursive: true });
		await mkdir(bin);
		await writeFile(path.join(baseline, 'keep.png'), 'previous screenshot');

		const exitStatus = await runCaptureScript({
			artifacts,
			bin,
			pnpmBody: `if [ -n "\${VISUAL_CAPTURE_DIR:-}" ]; then
  mkdir -p "$VISUAL_CAPTURE_DIR"
  exit 0
fi
`,
			root,
		});

		expect(exitStatus).toBe(1);
		expect(await readdir(artifacts)).toEqual(['baseline']);
		expect(await readFile(path.join(baseline, 'keep.png'), 'utf8')).toBe('previous screenshot');
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('classifies a missing docker binary and preserves non-zero exit statuses', () => {
	expect(isDockerMissingError({ code: 'ENOENT' })).toBe(true);
	expect(isDockerMissingError({ code: 'EACCES' })).toBe(false);
	expect(isDockerMissingError(new Error('boom'))).toBe(false);
	expect(dockerExitStatus({ status: 2 })).toBe(2);
	expect(dockerExitStatus({ status: null })).toBeUndefined();
	expect(dockerExitStatus('fail')).toBeUndefined();
});

test('both visual workflows pin the contract Playwright image', async () => {
	const workflows = await Promise.all(
		['visual-baseline.yml', 'visual-regression.yml'].map((file) =>
			readFile(path.join(repoRoot, '.github/workflows', file), 'utf8'),
		),
	);

	for (const text of workflows) {
		expect(text).toContain(PLAYWRIGHT_VISUAL_IMAGE);
		expect(text).toContain(`PLAYWRIGHT_BROWSERS_PATH: ${PLAYWRIGHT_BROWSERS_PATH}`);
	}
});
