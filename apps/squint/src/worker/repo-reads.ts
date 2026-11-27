import * as z from 'zod';
import { positiveIntegerSchema, shaSchema } from '../api/contract.js';
import type { Context } from './access.js';
import { installationFetch } from './access.js';
import { readGitHubJson } from './github.js';
import type { CheckRunSnapshot, ExternalId } from './review.js';
import { CHECK_NAME } from './review.js';

const COMPARISON_WORKFLOW = 'visual-regression.yml';
const BASELINE_WORKFLOW = 'visual-baseline.yml';
const BASELINE_BRANCH = 'main';
const BASELINE_EVENTS = new Set(['push', 'workflow_dispatch']);

/** A check run as the REST API returns it, from a read or a write. */
export const restCheckRunSchema = z.object({
	app: z.object({ id: z.number() }).nullable(),
	conclusion: z.string().nullable(),
	external_id: z.string().nullable(),
	head_sha: shaSchema,
	html_url: z.string().nullable(),
	id: positiveIntegerSchema,
	output: z.object({
		summary: z.string().nullable(),
		text: z.string().nullable(),
		title: z.string().nullable(),
	}),
	status: z.string(),
});

export type RestCheckRun = z.infer<typeof restCheckRunSchema>;

const checkRunsSchema = z.object({ check_runs: z.array(restCheckRunSchema) });
const pullSchema = z.object({ head: z.object({ sha: shaSchema }), state: z.string() });

const workflowRunSchema = z.object({
	conclusion: z.string().nullable(),
	event: z.string(),
	head_branch: z.string().nullable(),
	head_repository: z.object({ full_name: z.string() }).nullable(),
	head_sha: z.string(),
	id: positiveIntegerSchema,
	run_attempt: positiveIntegerSchema,
	status: z.string().nullable(),
});

export type WorkflowRun = z.infer<typeof workflowRunSchema>;

const workflowRunsSchema = z.object({ workflow_runs: z.array(workflowRunSchema) });

/** The pull request's head commit and state, or `undefined` when there is no such pull request. */
export async function fetchPull(
	context: Context,
	number: number,
): Promise<z.infer<typeof pullSchema> | undefined> {
	const response = await installationFetch(
		context,
		`/repos/${context.config.repository}/pulls/${number}`,
	);
	if (response.status === 404) return undefined;
	return readGitHubJson(response, pullSchema, 'pull request');
}

/** The App's `visual-review` check run on a commit. The newest wins if there is ever more than one. */
export async function findCheckRun(
	context: Context,
	sha: string,
): Promise<RestCheckRun | undefined> {
	const query = new URLSearchParams({
		app_id: String(context.config.appId),
		check_name: CHECK_NAME,
		filter: 'all',
		per_page: '100',
	});
	const { check_runs: runs } = await readGitHubJson(
		await installationFetch(
			context,
			`/repos/${context.config.repository}/commits/${sha}/check-runs?${query}`,
		),
		checkRunsSchema,
		'check run list',
	);
	return newest(
		runs.filter((run) => run.app?.id === context.config.appId),
		(run) => run.id,
	);
}

/** The fields of a REST check run that a `Review` reads. */
export function snapshot(context: Context, run: RestCheckRun): CheckRunSnapshot {
	return {
		conclusion: run.conclusion,
		externalId: run.external_id,
		headSha: run.head_sha,
		htmlUrl: run.html_url ?? `https://github.com/${context.config.repository}/runs/${run.id}`,
		title: run.output.title,
	};
}

/**
 * The latest comparison of a commit: the newest `Visual regression` run for it. A re-run keeps
 * the run id and raises its attempt as soon as it is requested.
 */
export async function latestComparison(
	context: Context,
	sha: string,
): Promise<WorkflowRun | undefined> {
	const query = new URLSearchParams({ event: 'pull_request', head_sha: sha, per_page: '1' });
	const { workflow_runs: runs } = await readGitHubJson(
		await installationFetch(
			context,
			`/repos/${context.config.repository}/actions/workflows/${COMPARISON_WORKFLOW}/runs?${query}`,
		),
		workflowRunsSchema,
		'comparison run list',
	);
	return runs[0];
}

/**
 * The newest successful `Visual baseline` run on `main`, from a push or a manual dispatch in this
 * repository. A fork's branch can also be called `main`, so the head repository must match.
 */
export async function latestBaseline(context: Context): Promise<WorkflowRun | undefined> {
	const query = new URLSearchParams({
		branch: BASELINE_BRANCH,
		per_page: '100',
		status: 'success',
	});
	const { workflow_runs: runs } = await readGitHubJson(
		await installationFetch(
			context,
			`/repos/${context.config.repository}/actions/workflows/${BASELINE_WORKFLOW}/runs?${query}`,
		),
		workflowRunsSchema,
		'baseline run list',
	);
	return newest(
		runs.filter(
			(run) =>
				BASELINE_EVENTS.has(run.event) &&
				run.head_branch === BASELINE_BRANCH &&
				run.head_repository?.full_name === context.config.repository &&
				run.status === 'completed' &&
				run.conclusion === 'success',
		),
		(run) => run.id,
	);
}

/** Whether a workflow run is the comparison run and attempt an external id records. */
export function isComparison(
	run: WorkflowRun | undefined,
	externalId: Pick<ExternalId, 'runAttempt' | 'runId'>,
): run is WorkflowRun {
	return run?.id === externalId.runId && run.run_attempt === externalId.runAttempt;
}

/** Whether a workflow run is the baseline run, attempt and commit an external id records. */
export function isBaseline(run: WorkflowRun | undefined, externalId: ExternalId): boolean {
	return (
		run?.id === externalId.baselineRunId &&
		run.run_attempt === externalId.baselineRunAttempt &&
		run.head_sha === externalId.baselineSha
	);
}

/** The item with the highest id, or `undefined` for none. */
export function newest<T>(items: Array<T>, id: (item: T) => number): T | undefined {
	let result: T | undefined;
	for (const item of items) if (result === undefined || id(item) > id(result)) result = item;
	return result;
}
