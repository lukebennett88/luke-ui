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
	downloadAuthoritativeBaseline,
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
	realArchive?: boolean;
	root: string;
	image?: string;
	platform?: string;
	command?: 'capture' | 'compare';
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
		tar: `#!/bin/sh
while [ "$#" -gt 0 ]; do
  if [ "$1" = -cf ] && [ "$2" != - ]; then touch "$2"; break; fi
  shift
done
exit 0
`,
	};

	if (options.realArchive) {
		delete stubBodies.tar;
		delete stubBodies.find;
		await mkdir(path.join(options.root, 'src'), { recursive: true });
	}

	await Promise.all(
		Object.entries(stubBodies).map(([command, body]) =>
			writeFile(path.join(options.bin, command), body, { mode: 0o755 }),
		),
	);

	await mkdir(path.join(options.root, 'cache'), { recursive: true });
	const script = containerCommand(options.command ?? 'capture')
		.replaceAll('/cache', path.join(options.root, 'cache'))
		.replaceAll('/work', path.join(options.root, 'work'))
		.replaceAll('-C /src ', `-C ${path.join(options.root, 'src')} `)
		.replaceAll('/artifacts', options.artifacts);

	try {
		execFileSync('bash', ['-c', script], {
			env: {
				...process.env,
				HOST_GID: '20',
				HOST_UID: '501',
				VISUAL_INSTALL_IMAGE: options.image ?? PLAYWRIGHT_VISUAL_IMAGE,
				VISUAL_INSTALL_PLATFORM: options.platform ?? PLAYWRIGHT_VISUAL_PLATFORM,
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
		`VISUAL_INSTALL_IMAGE=${PLAYWRIGHT_VISUAL_IMAGE}`,
		'-e',
		`VISUAL_INSTALL_PLATFORM=${PLAYWRIGHT_VISUAL_PLATFORM}`,
		'-e',
		'HOST_UID=501',
		'-e',
		'HOST_GID=20',
		'-v',
		`${repoRoot}:/src:ro`,
		'-v',
		`${artifactsDir}:/artifacts`,
		'-v',
		'luke-ui-visual-pnpm-store:/root/.local/share/pnpm/store',
		'-v',
		'luke-ui-visual-dependencies:/cache',
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

test('container worktree excludes generated host files and restores artefact ownership', () => {
	const body = containerCommand('capture');
	expect(body).toContain('--exclude=node_modules');
	expect(body).toContain('--exclude=.git');
	expect(body).toContain('--exclude=.artifacts');
	expect(body).toContain('--exclude=dist');
	expect(body).toContain('--exclude=apps/docs/src/generated');
	expect(body).toContain('ln -sfn /artifacts /work/.artifacts/visual-regression');
	expect(body).toContain(
		'PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 pnpm install --frozen-lockfile --no-runtime',
	);
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
					.toSorted()
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

test('baseline upload replaces the artifact when a workflow run is re-run', async () => {
	const workflow = await readFile(
		path.join(repoRoot, '.github/workflows/visual-baseline.yml'),
		'utf8',
	);

	expect(workflow).toMatch(/name: visual-baseline\n\s+overwrite: true/);
});

test('reuses only the exact newest successful run and attempt, independently of local captures', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-baseline-download-'));
	const baselineDir = path.join(root, 'baseline');
	const downloads: Array<number> = [];
	try {
		const first = await downloadAuthoritativeBaseline({
			baselineDir,
			run: { id: 7, run_attempt: 2, status: 'completed', conclusion: 'success' },
			async download(id, directory) {
				downloads.push(id);
				await writeFile(path.join(directory, 'capture.png'), 'attempt 2');
			},
		});
		expect(first).toEqual({ runId: 7, runAttempt: 2 });
		expect(await readFile(path.join(baselineDir, 'capture.png'), 'utf8')).toBe('attempt 2');

		await writeFile(path.join(baselineDir, 'capture.png'), 'local capture');
		await downloadAuthoritativeBaseline({
			baselineDir,
			run: { id: 7, run_attempt: 2, status: 'completed', conclusion: 'success' },
			async download() {
				throw new Error('the successful attempt should be cached');
			},
		});
		expect(await readFile(path.join(baselineDir, 'capture.png'), 'utf8')).toBe('attempt 2');
		await downloadAuthoritativeBaseline({
			baselineDir,
			run: { id: 7, run_attempt: 3, status: 'completed', conclusion: 'success' },
			async download(id, directory) {
				downloads.push(id);
				await writeFile(path.join(directory, 'capture.png'), 'attempt 3');
			},
		});
		expect(await readFile(path.join(baselineDir, 'capture.png'), 'utf8')).toBe('attempt 3');
		await Promise.all(
			[
				{ id: 7, run_attempt: 3, status: 'in_progress', conclusion: null },
				{ id: 7, run_attempt: 3, status: 'completed', conclusion: 'failure' },
			].map((run) => {
				return expect(
					downloadAuthoritativeBaseline({
						baselineDir,
						run,
						async download() {
							throw new Error('unusable runs must not be downloaded');
						},
					}),
				).rejects.toThrow('The newest Visual baseline run');
			}),
		);

		const second = await downloadAuthoritativeBaseline({
			baselineDir,
			run: { id: 8, run_attempt: 1, status: 'completed', conclusion: 'success' },
			async download(id, directory) {
				downloads.push(id);
				await writeFile(path.join(directory, 'capture.png'), 'new run');
			},
		});
		expect(second).toEqual({ runId: 8, runAttempt: 1 });
		expect(downloads).toEqual([7, 7, 8]);
		expect(await readFile(path.join(baselineDir, 'capture.png'), 'utf8')).toBe('new run');
		await expect(
			downloadAuthoritativeBaseline({
				baselineDir,
				run: { id: 9, status: 'completed', conclusion: 'failure' },
				async download() {
					throw new Error('failed runs must not be downloaded');
				},
			}),
		).rejects.toThrow('concluded failure');
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('an empty downloaded artifact cannot replace a usable baseline', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-baseline-empty-'));
	try {
		const baselineDir = path.join(root, 'baseline');
		await mkdir(baselineDir);
		await writeFile(path.join(baselineDir, 'keep.png'), 'keep');
		await expect(
			downloadAuthoritativeBaseline({
				baselineDir,
				run: { id: 3, status: 'completed', conclusion: 'success' },
				async download() {},
			}),
		).rejects.toThrow('no PNG screenshots');
		expect(await readFile(path.join(baselineDir, 'keep.png'), 'utf8')).toBe('keep');
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('Docker copies source but rebuilds ignored host outputs', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-local-source-'));
	const artifacts = path.join(root, 'artifacts');
	const bin = path.join(root, 'bin');
	try {
		await mkdir(artifacts);
		await mkdir(bin);
		await mkdir(path.join(root, 'src', 'dist'), { recursive: true });
		await mkdir(path.join(root, 'src', 'packages/@luke-ui/react/src/generated'), {
			recursive: true,
		});
		await writeFile(path.join(root, 'src', 'dist', 'host-build.js'), 'host build');
		await writeFile(
			path.join(root, 'src', 'packages/@luke-ui/react/src/generated/icons.tsx'),
			'host generation',
		);
		const options = {
			root,
			artifacts,
			bin,
			realArchive: true,
			pnpmBody: `if [ "$1" = install ]; then
  printf 'install\\n' >> '${root}/operations'
  mkdir -p node_modules
fi
if [ "$1" = build:packages ]; then
  test ! -e dist/host-build.js || exit 12
  test ! -e packages/@luke-ui/react/src/generated/icons.tsx || exit 13
  printf 'build\\n' >> '${root}/operations'
fi
if [ -n "\${VISUAL_CAPTURE_DIR:-}" ]; then
  printf 'fresh screenshot' > "$VISUAL_CAPTURE_DIR/current.png"
fi
`,
		};
		expect(await runCaptureScript(options)).toBe(0);
		expect(await readFile(path.join(root, 'operations'), 'utf8')).toBe('install\nbuild\n');
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('an empty cached baseline is downloaded again, and failed downloads are not cached', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-baseline-cache-'));
	const baselineDir = path.join(root, 'baseline');
	const run = { id: 12, run_attempt: 2, status: 'completed', conclusion: 'success' };
	let downloads = 0;
	try {
		const download = async (_id: number, directory: string) => {
			downloads += 1;
			await writeFile(path.join(directory, 'capture.png'), 'baseline');
		};
		await downloadAuthoritativeBaseline({ baselineDir, run, download });
		await writeFile(path.join(`${baselineDir}.cache`, '12-2', 'capture.png'), '');
		await downloadAuthoritativeBaseline({ baselineDir, run, download });
		expect(downloads).toBe(2);
		const nextRun = { ...run, run_attempt: 3 };
		await expect(
			downloadAuthoritativeBaseline({
				baselineDir,
				run: nextRun,
				async download(_id, directory) {
					await writeFile(path.join(directory, 'capture.png'), '');
				},
			}),
		).rejects.toThrow('no PNG screenshots');
		await expect(
			downloadAuthoritativeBaseline({
				baselineDir,
				run: nextRun,
				async download(_id, directory) {
					await writeFile(path.join(directory, 'capture.png'), 'partial download');
					throw new Error('download failed');
				},
			}),
		).rejects.toThrow('download failed');
		await downloadAuthoritativeBaseline({ baselineDir, run: nextRun, download });
		expect(downloads).toBe(3);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('Docker reuses native workspace installs but always rebuilds, captures and compares fresh source', async () => {
	const { root, source, run } = await createDockerInstallFixture();
	try {
		expect(await run()).toBe(0);
		await writeFile(path.join(source, 'source.ts'), 'fresh source');
		expect(await run()).toBe(0);
		expect(await readFile(path.join(root, 'operations'), 'utf8')).toBe(
			'install\nbuild\ncapture\nbuild\ncapture\n',
		);
		expect(await run({ command: 'compare' })).toBe(0);
		expect(await run({ command: 'compare' })).toBe(0);
		expect(await readFile(path.join(root, 'operations'), 'utf8')).toBe(
			'install\nbuild\ncapture\nbuild\ncapture\nbuild\ncompare\nbuild\ncompare\n',
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

for (const input of [
	'pnpm-lock.yaml',
	'pnpm-workspace.yaml',
	'package.json',
	'packages/fixture/package.json',
	'.npmrc',
	'.pnpmfile.cjs',
	'patches/native.patch',
	'image',
	'platform',
]) {
	test(`Docker invalidates the install cache when ${input} changes`, async () => {
		const { root, source, run } = await createDockerInstallFixture();
		try {
			expect(await run()).toBe(0);
			if (input !== 'image' && input !== 'platform') {
				await mkdir(path.dirname(path.join(source, input)), { recursive: true });
				await writeFile(path.join(source, input), 'changed install input');
			}
			const overrides: Parameters<typeof run>[0] = (() => {
				if (input === 'image') return { image: 'new-image@sha256:digest' };
				if (input === 'platform') return { platform: 'linux/arm64' };
				return {};
			})();
			expect(await run(overrides)).toBe(0);
			expect(await readFile(path.join(root, 'operations'), 'utf8')).toBe(
				'install\nbuild\ncapture\ninstall\nbuild\ncapture\n',
			);
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});
}

test('Docker retries failed installs and discards partial dependency archives', async () => {
	const { root, source, run } = await createDockerInstallFixture();
	try {
		await writeFile(path.join(source, 'fail-install'), '');
		expect(await run()).toBe(17);
		expect(await run()).toBe(17);
		await rm(path.join(source, 'fail-install'));
		expect(await run()).toBe(0);
		expect(await run()).toBe(0);
		await Promise.all(
			(await readdir(path.join(root, 'cache'))).map((archive) => {
				return writeFile(path.join(root, 'cache', archive), 'partial archive');
			}),
		);
		expect(await run()).toBe(0);
		expect(await readFile(path.join(root, 'operations'), 'utf8')).toBe(
			'install\ninstall\ninstall\nbuild\ncapture\nbuild\ncapture\ninstall\nbuild\ncapture\n',
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

async function createDockerInstallFixture() {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-local-install-cache-'));
	const artifacts = path.join(root, 'artifacts');
	const bin = path.join(root, 'bin');
	const source = path.join(root, 'src');
	await mkdir(artifacts);
	await mkdir(bin);
	await mkdir(path.join(source, 'packages', 'fixture'), { recursive: true });
	await writeFile(path.join(source, 'package.json'), '{}');
	await writeFile(path.join(source, 'pnpm-lock.yaml'), 'lockfile');
	await writeFile(path.join(source, 'pnpm-workspace.yaml'), 'packages: []');
	await writeFile(path.join(source, 'packages', 'fixture', 'package.json'), '{}');
	await mkdir(path.join(source, 'node_modules'));
	await writeFile(path.join(source, 'node_modules', 'host-only'), 'host');
	const options = {
		root,
		artifacts,
		bin,
		realArchive: true,
		pnpmBody: `if [ "$1" = install ]; then
  printf 'install\n' >> '${root}/operations'
  test ! -e node_modules/host-only || exit 12
  mkdir -p node_modules/native packages/fixture/node_modules
  printf 'linux-amd64' > node_modules/native/platform
  ln -s ../../../node_modules/native packages/fixture/node_modules/native
  if [ -e fail-install ]; then exit 17; fi
fi
if [ "$1" = build:packages ]; then
  test "$(cat packages/fixture/node_modules/native/platform)" = linux-amd64 || exit 13
  test ! -e dist || exit 14
  test ! -e packages/fixture/src/generated || exit 15
  if [ -e source.ts ]; then test "$(cat source.ts)" = "fresh source" || exit 16; fi
  mkdir -p dist packages/fixture/src/generated
  printf 'build\n' >> '${root}/operations'
fi
if [ -n "\${VISUAL_CAPTURE_DIR:-}" ]; then
  printf 'capture\n' >> '${root}/operations'
  printf 'fresh screenshot' > "$VISUAL_CAPTURE_DIR/current.png"
fi
if [ "$4" = test:visual:run ]; then
  printf 'compare\\n' >> '${root}/operations'
fi
`,
	};
	const run = async (overrides: Partial<Parameters<typeof runCaptureScript>[0]> = {}) => {
		await rm(path.join(root, 'work'), { recursive: true, force: true });
		return runCaptureScript({ ...options, ...overrides });
	};
	return { root, source, run };
}
