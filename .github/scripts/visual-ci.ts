// Visual workflow helpers. Subcommands keep the YAML thin without a CI framework:
//   resolve-baseline — pick the newest Visual baseline run on main
//   check-captures   — fail when a capture directory has no PNGs
//   summarise        — turn summary.json into the job summary and review output

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { appendFile, readFile, readdir } from 'node:fs/promises';
import {
	VISUAL_BASELINE_DIR,
	VISUAL_SUMMARY_FILE,
} from '../../packages/@luke-ui/react/scripts/visual-regression-contract.js';
import type {
	VisualCounts,
	VisualResult,
	VisualStatus,
} from '../../packages/@luke-ui/react/scripts/visual-regression-lib.js';

export type { VisualCounts, VisualStatus };

export type VisualSummary = {
	counts: VisualCounts;
	results: Array<VisualResult>;
};

export type BaselineRun = {
	id: number;
	status: string | null;
	conclusion: string | null;
};

export type BaselineRunDecision = { ok: true; runId: number } | { ok: false; reason: string };

const ARTIFACT_NAME = 'visual-baseline';
const BASELINE_BRANCH = 'main';
const WORKFLOW_FILE = 'visual-baseline.yml';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function fromRepoRoot(relativePath: string): string {
	return path.join(repoRoot, ...relativePath.split('/'));
}

/**
 * Judges the single newest `visual-baseline.yml` run on `main`.
 *
 * The caller must pass the newest run unconditionally — never a run list
 * pre-filtered to successes. Falling back to an older green run would compare a
 * PR against a baseline that no longer reflects `main`.
 */
export function decideBaselineRun(
	run: BaselineRun | undefined,
	runUrl: (runId: number) => string,
): BaselineRunDecision {
	if (run === undefined) {
		return {
			ok: false,
			reason:
				'No Visual baseline workflow/run exists on `main` yet. After this PR merges, let the Visual baseline workflow run on `main`, then future PRs can compare against it.',
		};
	}

	if (run.status !== 'completed') {
		return {
			ok: false,
			reason: `The newest Visual baseline run on \`main\` is ${run.status ?? 'in an unknown state'}. Wait for ${runUrl(run.id)} to finish, then re-run this job.`,
		};
	}

	if (run.conclusion !== 'success') {
		return {
			ok: false,
			reason: `The newest Visual baseline run on \`main\` concluded ${run.conclusion ?? 'with no conclusion'}. Re-run ${runUrl(run.id)} until it succeeds, then re-run this job.`,
		};
	}

	return { ok: true, runId: run.id };
}

/** GitHub answers 404 when the workflow file is absent from `main` (bootstrap). */
export function isWorkflowMissingStatus(status: number): boolean {
	return status === 404;
}

/** Captures a human must look at. The `review` job gates on this being non-zero. */
export function countRequiringReview(counts: VisualCounts): number {
	return counts.changed + counts.added + counts.removed;
}

const COUNT_ORDER: ReadonlyArray<VisualStatus> = ['changed', 'added', 'removed', 'unchanged'];

/** Job-summary table rows with review-worthy statuses first. */
export function countsTableRows(counts: VisualCounts): Array<[string, string]> {
	return COUNT_ORDER.map((status) => [status, String(counts[status])]);
}

/**
 * Counts `.png` files under `directory`. A missing directory counts as zero so
 * "nothing rendered" and "output never created" share one failure path.
 */
export async function countPngs(directory: string): Promise<number> {
	const entries = await readdir(directory, { recursive: true, withFileTypes: true }).catch(
		() => [],
	);

	let count = 0;
	for (const entry of entries) {
		if (entry.isFile() && entry.name.endsWith('.png')) count += 1;
	}
	return count;
}

function requireEnv(name: string): string {
	const value = process.env[name];
	if (value === undefined || value === '') {
		throw new Error(`${name} is not set. This script only runs inside GitHub Actions.`);
	}
	return value;
}

async function writeOutput(name: string, value: string | number) {
	const file = requireEnv('GITHUB_OUTPUT');
	await appendFile(file, `${name}=${value}\n`);
}

async function writeStepSummary(markdown: string) {
	const file = requireEnv('GITHUB_STEP_SUMMARY');
	await appendFile(file, markdown);
}

function fail(message: string): never {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function info(message: string) {
	process.stdout.write(`${message}\n`);
}

type WorkflowRunsResponse = {
	workflow_runs: Array<{
		id: number;
		status: string | null;
		conclusion: string | null;
	}>;
};

async function fetchNewestBaselineRun(
	token: string,
	owner: string,
	repo: string,
): Promise<BaselineRun | undefined | 'workflow-missing'> {
	const url = new URL(
		`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${WORKFLOW_FILE}/runs`,
	);
	url.searchParams.set('branch', BASELINE_BRANCH);
	url.searchParams.set('per_page', '1');

	const response = await fetch(url, {
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${token}`,
			'X-GitHub-Api-Version': '2022-11-28',
		},
	});

	if (isWorkflowMissingStatus(response.status)) {
		return 'workflow-missing';
	}

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`GitHub API ${response.status} listing ${WORKFLOW_FILE} runs: ${body}`);
	}

	const data = (await response.json()) as WorkflowRunsResponse;
	return data.workflow_runs[0];
}

async function resolveBaseline() {
	const token = requireEnv('GITHUB_TOKEN');
	const [owner, repo] = requireEnv('GITHUB_REPOSITORY').split('/');
	if (owner === undefined || repo === undefined) {
		fail('GITHUB_REPOSITORY is not in "owner/repo" form.');
	}

	const runUrl = (runId: number) => `https://github.com/${owner}/${repo}/actions/runs/${runId}`;
	const newestRun = await fetchNewestBaselineRun(token, owner, repo);

	if (newestRun === 'workflow-missing') {
		fail(
			'No Visual baseline workflow/run exists on `main` yet. After this PR merges, let the Visual baseline workflow run on `main`, then future PRs can compare against it.',
		);
	}

	const decision = decideBaselineRun(newestRun, runUrl);
	if (!decision.ok) {
		fail(decision.reason);
	}

	info(`Baseline from Visual baseline run ${decision.runId}: ${runUrl(decision.runId)}`);
	info(`Artifact "${ARTIFACT_NAME}" will be downloaded by actions/download-artifact.`);
	await writeOutput('run-id', decision.runId);
}

async function checkCaptures() {
	const configured = process.env.VISUAL_CAPTURE_DIR?.trim();
	const directory = configured ? path.resolve(configured) : fromRepoRoot(VISUAL_BASELINE_DIR);

	const count = await countPngs(directory);
	info(`Found ${count} screenshot(s) in ${directory}.`);

	if (count === 0) {
		fail(
			'No visual captures were found, so the baseline cannot be used. Check the capture or download step above.',
		);
	}
}

async function summarise() {
	const summaryPath = fromRepoRoot(VISUAL_SUMMARY_FILE);
	const summary: VisualSummary = JSON.parse(await readFile(summaryPath, 'utf8'));
	const rows = countsTableRows(summary.counts)
		.map(([status, count]) => `| ${status} | ${count} |`)
		.join('\n');

	await writeStepSummary(`### Visual regression\n\n| status | count |\n| --- | --- |\n${rows}\n`);

	const review = countRequiringReview(summary.counts);
	await writeOutput('review', review);

	const needingReview = summary.results.filter((result) => result.status !== 'unchanged');
	if (needingReview.length === 0) {
		info('No visual changes.');
		return;
	}

	info(`${review} capture(s) need review:`);
	for (const result of needingReview) {
		info(`  ${result.status}\t${result.id}`);
	}
}

const entry = process.argv[1];
const isCli = entry !== undefined && import.meta.url === pathToFileURL(path.resolve(entry)).href;

if (isCli) {
	const command = process.argv.slice(2).find((arg) => arg !== '--');

	switch (command) {
		case 'resolve-baseline':
			await resolveBaseline();
			break;
		case 'check-captures':
			await checkCaptures();
			break;
		case 'summarise':
			await summarise();
			break;
		case undefined:
			fail('Usage: visual-ci <resolve-baseline|check-captures|summarise>');
			break;
		default:
			fail(`Unknown command: ${command}`);
	}
}
