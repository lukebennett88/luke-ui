// Pure decision logic for the visual workflows. Everything here is a plain
// function over plain data so it can be unit tested without the GitHub API, the
// Actions runtime, or the filesystem. The scripts beside this file do the I/O.

import type { VisualCounts, VisualStatus } from './visual-summary-types.js';

/**
 * The fields of a workflow run this decision actually depends on. Octokit's
 * response carries far more, but narrowing to a structural type keeps the
 * decision testable with object literals instead of a mocked API client.
 */
export type BaselineRun = {
	id: number;
	status: string | null;
	conclusion: string | null;
};

export type BaselineRunDecision = { ok: true; runId: number } | { ok: false; reason: string };

/**
 * Judges the single newest `visual-baseline.yml` run on `main`.
 *
 * The caller must pass the newest run unconditionally — never a run list
 * pre-filtered to successes. Falling back to an older green run would compare a
 * PR against a baseline that no longer reflects `main`, silently hiding the very
 * regressions this workflow exists to catch.
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

/**
 * GitHub answers 404 when the workflow file itself is absent from `main`, which
 * is the expected bootstrap state while the workflow is still only on a branch.
 * It is reported as a normal missing baseline rather than an API failure.
 */
export function isWorkflowMissingStatus(status: number): boolean {
	return status === 404;
}

/**
 * The number of captures a human has to look at. The `review` job gates on this
 * being non-zero, so `unchanged` is deliberately excluded.
 */
export function countRequiringReview(counts: VisualCounts): number {
	return counts.changed + counts.added + counts.removed;
}

const COUNT_ORDER: ReadonlyArray<VisualStatus> = ['changed', 'added', 'removed', 'unchanged'];

/**
 * Renders the counts as job-summary table rows, newest-interest first, so the
 * statuses that force a review sit at the top of the table.
 */
export function countsTableRows(counts: VisualCounts): Array<[string, string]> {
	return COUNT_ORDER.map((status) => [status, String(counts[status])]);
}
