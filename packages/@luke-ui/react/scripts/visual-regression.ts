import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { arch, platform } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { compareCaptures, renderReport, validateCaptureIds } from './visual-regression-lib.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(packageRoot, '../../..');
const artifacts = path.join(repoRoot, '.artifacts/visual-regression');

// Frozen Vanilla Extract goldens, captured once on the `ve-final` tag (epic #144,
// ticket #145). The Panda stylesheet is compared with this committed set. Re-capture
// only after an intentional visual change.
const goldensRoot = path.join(packageRoot, 'visual-goldens');
const goldenCaptures = path.join(goldensRoot, 'captures');
const manifestPath = path.join(goldensRoot, 'manifest.json');

type GoldenManifest = {
	arch: string;
	captureCount: number;
	capturedFromRef: string;
	capturedFromSha: string;
	platform: string;
	signature: string;
};

async function main() {
	if (process.argv.includes('--update-goldens')) {
		await updateGoldens();
		return;
	}
	await compareAgainstGoldens();
}

async function compareAgainstGoldens() {
	const manifest = await readManifest();
	const current = process.env.GITHUB_SHA ?? 'working tree';
	await warnOnDrift(manifest);

	const currentCaptures = path.join(artifacts, 'current');
	await capture(currentCaptures);

	const reportDir = path.join(artifacts, 'report');
	const results = await compareCaptures(
		goldenCaptures,
		currentCaptures,
		path.join(reportDir, 'diffs'),
	);
	const counts = await renderReport(
		results,
		{
			base: `ve-final ${manifest.capturedFromSha.slice(0, 12)} (frozen)`,
			current,
			platform: `${platform()} ${arch()} Chromium`,
		},
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

async function updateGoldens() {
	await capture(goldenCaptures);
	const manifest: GoldenManifest = {
		arch: arch(),
		captureCount: await countPngs(goldenCaptures),
		capturedFromRef: output(['describe', '--tags', '--always', '--dirty']),
		capturedFromSha: output(['rev-parse', 'HEAD']),
		platform: platform(),
		signature: await signature(),
	};
	// Tab-indented to match the repo formatter, so a CI re-freeze stays clean.
	await writeFile(manifestPath, `${JSON.stringify(manifest, null, '\t')}\n`);
	// oxlint-disable-next-line no-console
	console.log(
		`Froze ${manifest.captureCount} visual goldens from ${manifest.capturedFromRef} into ${path.relative(repoRoot, goldenCaptures)}`,
	);
}

async function readManifest(): Promise<GoldenManifest> {
	try {
		return JSON.parse(await readFile(manifestPath, 'utf8')) as GoldenManifest;
	} catch {
		throw new Error(
			`No frozen visual goldens at ${path.relative(repoRoot, manifestPath)}. Capture them with \`pnpm --filter @luke-ui/react test:visual:freeze\` on the \`ve-final\` tree.`,
		);
	}
}

async function warnOnDrift(manifest: GoldenManifest) {
	const messages: Array<string> = [];
	if (manifest.platform !== platform() || manifest.arch !== arch()) {
		messages.push(
			`platform drift: goldens captured on ${manifest.platform}/${manifest.arch}, running on ${platform()}/${arch()} — pixel diffs may be spurious.`,
		);
	}
	const current = await signature();
	if (manifest.signature !== current) {
		messages.push(
			`config/lockfile signature drift: goldens ${manifest.signature}, current ${current} — expected during the Panda migration as vitest.config.ts and the lockfile change.`,
		);
	}
	for (const message of messages) {
		// oxlint-disable-next-line no-console
		console.warn(`⚠ ${message}`);
	}
}

async function signature() {
	return createHash('sha256')
		.update(await readFile(path.join(repoRoot, 'pnpm-lock.yaml')))
		.update(await readFile(path.join(packageRoot, 'vitest.config.ts')))
		.digest('hex')
		.slice(0, 12);
}

async function capture(target: string) {
	await validateCaptureIds(path.join(packageRoot, 'src'));
	await rm(target, { force: true, recursive: true });
	await mkdir(target, { recursive: true });
	run('corepack', ['pnpm', 'build:packages']);
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
		repoRoot,
		{ ...process.env, VISUAL_CAPTURE_DIR: target },
	);
}

async function countPngs(root: string) {
	const entries = await readdir(root, { recursive: true, withFileTypes: true });
	return entries.filter((entry) => entry.isFile() && entry.name.endsWith('.png')).length;
}

function run(command: string, args: Array<string>, cwd = repoRoot, env = process.env) {
	return execFileSync(command, args, { cwd, env, stdio: 'inherit' });
}

function output(args: Array<string>, cwd = repoRoot) {
	return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

await main();
