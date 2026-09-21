// Downloads the `visual-baseline` artefact from the newest Visual baseline run
// on `main` so the PR can be compared against it.
//
// Replaces the inline `gh api` / `gh run download` shell block. The decision
// about which run is acceptable lives in `visual-baseline-run.ts`; this file is
// only the GitHub API and filesystem work around it.

import artifact, { ArtifactNotFoundError } from '@actions/artifact';
import * as core from '@actions/core';
import { getOctokit } from '@actions/github';
import { mkdir } from 'node:fs/promises';
import { countPngs } from './count-pngs.js';
import { fromRepoRoot, VISUAL_BASELINE_DIR } from './repo-paths.js';
import { decideBaselineRun, isWorkflowMissingStatus } from './visual-baseline-run.js';

const ARTIFACT_NAME = 'visual-baseline';
const BASELINE_BRANCH = 'main';
const WORKFLOW_FILE = 'visual-baseline.yml';

await main();

async function main() {
	const token = requireEnv('GITHUB_TOKEN');
	const [owner, repo] = requireEnv('GITHUB_REPOSITORY').split('/');
	if (owner === undefined || repo === undefined) {
		core.setFailed('GITHUB_REPOSITORY is not in "owner/repo" form.');
		return;
	}

	const runUrl = (runId: number) => `https://github.com/${owner}/${repo}/actions/runs/${runId}`;
	const octokit = getOctokit(token);

	// Deliberately unfiltered by status: the newest run is the only one that may
	// be used, so it must be fetched even when it failed or is still running.
	const newestRun = await fetchNewestBaselineRun(octokit, owner, repo);
	if (newestRun === 'workflow-missing') {
		core.setFailed(
			'No Visual baseline workflow/run exists on `main` yet. After this PR merges, let the Visual baseline workflow run on `main`, then future PRs can compare against it.',
		);
		return;
	}

	const decision = decideBaselineRun(newestRun, runUrl);
	if (!decision.ok) {
		core.setFailed(decision.reason);
		return;
	}

	const { runId } = decision;
	core.info(`Baseline from Visual baseline run ${runId}: ${runUrl(runId)}`);

	const destination = fromRepoRoot(VISUAL_BASELINE_DIR);
	await mkdir(destination, { recursive: true });

	const findBy = {
		repositoryName: repo,
		repositoryOwner: owner,
		token,
		workflowRunId: runId,
	};

	const found = await artifact.getArtifact(ARTIFACT_NAME, { findBy }).catch((error: unknown) => {
		if (error instanceof ArtifactNotFoundError) return undefined;
		throw error;
	});

	if (found === undefined) {
		core.setFailed(
			`The "${ARTIFACT_NAME}" artefact is missing or expired on run ${runId}. Re-run ${runUrl(runId)}, then re-run this job.`,
		);
		return;
	}

	await artifact.downloadArtifact(found.artifact.id, { findBy, path: destination });

	const count = await countPngs(destination);
	core.info(`Downloaded ${count} baseline screenshots to ${VISUAL_BASELINE_DIR}.`);
	if (count === 0) {
		core.setFailed(
			`The "${ARTIFACT_NAME}" artefact from run ${runId} contained no screenshots. Re-run ${runUrl(runId)}, then re-run this job.`,
		);
	}
}

/**
 * Fetches only the newest run, on `main`, regardless of how it ended. Returns
 * `'workflow-missing'` for the bootstrap case where `visual-baseline.yml` is not
 * on `main` yet and the API answers 404.
 */
async function fetchNewestBaselineRun(
	octokit: ReturnType<typeof getOctokit>,
	owner: string,
	repo: string,
) {
	try {
		const response = await octokit.rest.actions.listWorkflowRuns({
			branch: BASELINE_BRANCH,
			owner,
			per_page: 1,
			repo,
			workflow_id: WORKFLOW_FILE,
		});
		return response.data.workflow_runs[0];
	} catch (error: unknown) {
		if (
			typeof error === 'object' &&
			error !== null &&
			'status' in error &&
			typeof error.status === 'number' &&
			isWorkflowMissingStatus(error.status)
		) {
			return 'workflow-missing' as const;
		}
		throw error;
	}
}

function requireEnv(name: string): string {
	const value = process.env[name];
	if (value === undefined || value === '') {
		throw new Error(`${name} is not set. This script only runs inside GitHub Actions.`);
	}
	return value;
}
