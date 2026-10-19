import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';
import {
	PLAYWRIGHT_BROWSERS_PATH,
	PLAYWRIGHT_VISUAL_IMAGE,
	PLAYWRIGHT_VISUAL_PLATFORM,
} from '../../packages/@luke-ui/react/scripts/visual-regression-contract.js';
import {
	buildDockerRunArgs,
	containerCommand,
	dockerExitStatus,
	isDockerMissingError,
} from './visual-local.js';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptsDir, '../..');

test('docker args pin amd64, the contract image, and the image browser path', () => {
	const artifactsDir = path.join(repoRoot, '.artifacts', 'visual-regression');
	const args = buildDockerRunArgs({
		artifactsDir,
		command: 'compare',
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
		repoRoot: spacedRoot,
	});

	expect(args).toContain(`${spacedRoot}:/src:ro`);
	expect(args).toContain(`${spacedArtifacts}:/artifacts`);
	expect(args.filter((arg) => arg.includes('luke ui'))).toHaveLength(2);
});

test('capture writes the baseline path; compare runs test:visual without that env', () => {
	expect(containerCommand('capture')).toContain(
		'VISUAL_CAPTURE_DIR=/work/.artifacts/visual-regression/baseline',
	);
	expect(containerCommand('capture')).toContain('test:visual:capture');
	expect(containerCommand('compare')).toContain('test:visual');
	expect(containerCommand('compare')).not.toContain('VISUAL_CAPTURE_DIR=');
	expect(containerCommand('compare')).not.toContain('test:visual:capture');
});

test('container worktree skips host node_modules and links host artefacts', () => {
	const body = containerCommand('capture');
	expect(body).toContain('--exclude=node_modules');
	expect(body).toContain('--exclude=.git');
	expect(body).toContain('--exclude=.artifacts');
	expect(body).toContain('ln -sfn /artifacts /work/.artifacts/visual-regression');
	expect(body).toContain('PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1');
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
