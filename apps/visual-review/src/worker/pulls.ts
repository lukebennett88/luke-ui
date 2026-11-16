import { z } from 'zod';
import type { Context } from './access.js';
import { assertSameOrigin, installationFetch, readSession, reviewerLogin } from './access.js';
import { readGitHubJson, upstream } from './github.js';
import { ApiError, json } from './http.js';
import type { CheckRunSnapshot, ExternalId, Review } from './review.js';
import {
	CHECK_NAME,
	COMMENT_MARKER,
	COMPARING_STATUS,
	decisionStatus,
	historyEntry,
	isValidNote,
	normalizeNote,
	parseExternalId,
	positiveIntegerSchema,
	prependHistory,
	reviewFromCheckRun,
	rewriteCommentStatus,
	rewriteSummary,
	sameExternalId,
	shaSchema,
	statusLine,
} from './review.js';

const PULLS_CACHE_SECONDS = 30;
const MAX_BODY_BYTES = 4096;
const MAX_COMMENT_PAGES = 10;
const NEEDS_REVIEW_STATUS = 'Needs review';
const COMPARISON_WORKFLOW = 'visual-regression.yml';
const BASELINE_WORKFLOW = 'visual-baseline.yml';
const BASELINE_BRANCH = 'main';
const BASELINE_EVENTS = new Set(['push', 'workflow_dispatch']);

const OPEN_PULL_REQUESTS_QUERY = `query OpenPullRequests($owner: String!, $name: String!, $appId: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequests(states: OPEN, first: 100, orderBy: { field: CREATED_AT, direction: DESC }) {
      nodes {
        number
        title
        url
        isDraft
        headRefName
        headRefOid
        author { login }
        commits(last: 1) {
          nodes {
            commit {
              oid
              checkSuites(first: 5, filterBy: { appId: $appId }) {
                nodes {
                  checkRuns(first: 10, filterBy: { checkName: "${CHECK_NAME}", checkType: ALL }) {
                    nodes { databaseId conclusion externalId title url }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`;

const graphqlCheckRunSchema = z.object({
	conclusion: z.string().nullable(),
	databaseId: positiveIntegerSchema,
	externalId: z.string().nullable(),
	title: z.string().nullable(),
	url: z.string(),
});

const graphqlPullSchema = z.object({
	author: z.object({ login: z.string() }).nullable(),
	commits: z.object({
		nodes: z.array(
			z
				.object({
					commit: z.object({
						checkSuites: z
							.object({
								nodes: z.array(
									z
										.object({
											checkRuns: z
												.object({ nodes: z.array(graphqlCheckRunSchema.nullable()) })
												.nullable(),
										})
										.nullable(),
								),
							})
							.nullable(),
						oid: shaSchema,
					}),
				})
				.nullable(),
		),
	}),
	headRefName: z.string(),
	headRefOid: shaSchema,
	isDraft: z.boolean(),
	number: positiveIntegerSchema,
	title: z.string(),
	url: z.string(),
});

const graphqlPullsSchema = z.object({
	data: z.object({
		repository: z.object({
			pullRequests: z.object({ nodes: z.array(graphqlPullSchema.nullable()) }),
		}),
	}),
});

const restCheckRunSchema = z.object({
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

type RestCheckRun = z.infer<typeof restCheckRunSchema>;

const checkRunsSchema = z.object({ check_runs: z.array(restCheckRunSchema) });
const pullSchema = z.object({ head: z.object({ sha: shaSchema }), state: z.string() });
const commentsSchema = z.array(
	z.object({
		body: z.string().nullish(),
		id: positiveIntegerSchema,
		user: z.object({ login: z.string() }).nullable(),
	}),
);

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

type WorkflowRun = z.infer<typeof workflowRunSchema>;

const workflowRunsSchema = z.object({ workflow_runs: z.array(workflowRunSchema) });

const decisionBodySchema = z.object({
	decision: z.enum(['approve', 'request-changes']),
	headSha: shaSchema,
	note: z.string().optional(),
	runAttempt: positiveIntegerSchema,
	runId: positiveIntegerSchema,
});

/** `GET /api/pulls`: every open pull request with its head commit's review. Cached for 30 s. */
export async function listPulls(context: Context): Promise<Response> {
	const cacheKey = new Request(`${context.config.appOrigin}/api/pulls`);
	const cached = await context.deps.cache?.match(cacheKey);
	if (cached) return cached;

	const [owner = '', name = ''] = context.config.repository.split('/');
	const result = await readGitHubJson(
		await installationFetch(context, '/graphql', {
			body: {
				query: OPEN_PULL_REQUESTS_QUERY,
				variables: { appId: context.config.appId, name, owner },
			},
			method: 'POST',
		}),
		graphqlPullsSchema,
		'pull request list',
	);
	const pulls = result.data.repository.pullRequests.nodes.flatMap((pull) => {
		if (!pull) return [];
		return [
			{
				author: pull.author?.login ?? null,
				draft: pull.isDraft,
				headRef: pull.headRefName,
				headSha: pull.headRefOid,
				number: pull.number,
				review: graphqlReview(pull),
				title: pull.title,
				url: pull.url,
			},
		];
	});
	const response = json({ pulls }, { cacheControl: `public, max-age=${PULLS_CACHE_SECONDS}` });
	await context.deps.cache?.put(cacheKey, response.clone());
	return response;
}

function graphqlReview(pull: z.infer<typeof graphqlPullSchema>): Review | null {
	const commit = pull.commits.nodes[0]?.commit;
	if (commit?.oid !== pull.headRefOid) return null;
	const runs = (commit.checkSuites?.nodes ?? []).flatMap((suite) =>
		(suite?.checkRuns?.nodes ?? []).flatMap((run) => (run ? [run] : [])),
	);
	const run = newest(runs, (candidate) => candidate.databaseId);
	if (!run) return null;
	return reviewFromCheckRun({
		conclusion: run.conclusion?.toLowerCase() ?? null,
		externalId: run.externalId,
		headSha: commit.oid,
		htmlUrl: run.url,
		title: run.title,
	});
}

/** `GET /api/pulls/:number/review`: the review of the pull request's current head commit. */
export async function getReview(context: Context, number: number): Promise<Response> {
	const pull = await fetchPull(context, number);
	if (!pull) throw new ApiError(404, 'not-found', 'There is no such pull request.');
	const run = await findCheckRun(context, pull.head.sha);
	return json({
		headSha: pull.head.sha,
		review: run ? reviewFromCheckRun(snapshot(context, run)) : null,
	});
}

/**
 * `POST /api/pulls/:number/decision`: approves or requests changes on the head commit's check run,
 * then updates the sticky comment's status. Each check fails before anything is written. A
 * publication or a comparison re-run that races the decision makes the backend withdraw it.
 */
export async function decide(context: Context, number: number): Promise<Response> {
	const reviewer = await readSession(context);
	if (!reviewer) throw new ApiError(401, 'unauthenticated', 'Sign in to review.');
	assertSameOrigin(context);
	const body = await readDecisionBody(context.request);
	const login = await reviewerLogin(context, reviewer);
	if (!login) {
		throw new ApiError(403, 'forbidden', 'Reviewing needs write access to the repository.');
	}

	const pull = await fetchPull(context, number);
	if (pull?.state !== 'open') {
		throw new ApiError(404, 'not-found', 'The pull request is not open.');
	}
	if (pull.head.sha !== body.headSha) {
		throw new ApiError(409, 'stale', 'The pull request has a newer commit. Reload the review.');
	}
	const run = await findCheckRun(context, body.headSha);
	const externalId = run ? parseExternalId(run.external_id) : undefined;
	if (!run || !externalId) {
		throw new ApiError(404, 'not-found', 'The commit has no visual review check.');
	}
	if (run.status !== 'completed' || externalId.kind !== 'review') {
		throw new ApiError(409, 'not-reviewable', 'This comparison has nothing to review.');
	}
	if (externalId.runId !== body.runId || externalId.runAttempt !== body.runAttempt) {
		throw staleComparison();
	}
	if (
		externalId.baselineSha === null ||
		externalId.baselineRunId === null ||
		externalId.baselineRunAttempt === null
	) {
		throw new ApiError(
			409,
			'unverified-baseline',
			'The comparison has no verified baseline. Re-run the comparison.',
		);
	}
	const baseline = await latestBaseline(context);
	if (
		baseline?.id !== externalId.baselineRunId ||
		baseline.run_attempt !== externalId.baselineRunAttempt ||
		baseline.head_sha !== externalId.baselineSha
	) {
		throw new ApiError(
			409,
			'stale-baseline',
			'A newer baseline exists. Update the branch or re-run the comparison.',
		);
	}
	const comparison = await latestComparison(context, body.headSha);
	if (
		!isComparison(comparison, externalId) ||
		comparison.status !== 'completed' ||
		comparison.conclusion !== 'success'
	) {
		throw staleComparison();
	}

	const write: DecisionWrite = {
		conclusion: body.decision === 'approve' ? 'success' : 'failure',
		externalId,
		headSha: body.headSha,
		login,
		note: body.note,
		now: new Date(context.deps.now()),
		number,
		run,
		status: decisionStatus(body.decision, login),
	};
	// The write starts after a microtask, so `waitUntil` holds it before any request leaves. A client
	// that disconnects then cannot cancel the decision between its write and its repair.
	const work = Promise.resolve().then(() => writeDecision(context, write));
	context.waitUntil(work.catch(() => undefined));
	const decided = await work;

	const review = reviewFromCheckRun(snapshot(context, decided));
	if (!review) throw upstream('GitHub sent back a check run without its external id.');
	return json({ review });
}

interface DecisionWrite {
	conclusion: 'failure' | 'success';
	/** The external id the decision was validated against. */
	externalId: ExternalId;
	headSha: string;
	login: string;
	note: string | undefined;
	now: Date;
	number: number;
	/** The check run as it was read before the decision. */
	run: RestCheckRun;
	status: string;
}

/** What a repair writes to the check run's conclusion, title, summary and history. */
interface Presentation {
	conclusion: 'action_required' | 'failure' | 'success';
	entry: string;
	summary: string;
	title: string;
}

const MAX_REPAIR_ATTEMPTS = 3;
/** How many times one repair attempt tries its write. */
const MAX_REPAIR_TRIES = 3;
const CLEAN_STATUS = 'No visual changes';
const FAILED_STATUS = 'Comparison failed';
const REPLACED_SUMMARY =
	'A decision written at the same moment replaced this summary, and the review app still has the report.';

/** Writes the decision, then confirms it. Returns the check run as the decision's write left it. */
async function writeDecision(context: Context, write: DecisionWrite): Promise<RestCheckRun> {
	const { now, run, status } = write;
	let decided: RestCheckRun;
	try {
		decided = await patchCheckRun(context, run.id, {
			completed_at: now.toISOString(),
			conclusion: write.conclusion,
			output: {
				summary: rewriteSummary(run.output.summary, status),
				text: prependHistory(run.output.text, historyEntry(now, status, write.note)),
				title: status,
			},
			status: 'completed',
		});
	} catch {
		// A write that failed in transit may still have landed, on the validated record or on a newer
		// one. The withdrawal's response shows which, and the repair restores a newer record.
		const notRecorded = upstream('GitHub did not record the decision. Try again.');
		await repair(
			context,
			write,
			run,
			write.externalId,
			withdrawal(write, 'its write could not be confirmed'),
		).catch(() => {
			throw notRecorded;
		});
		throw notRecorded;
	}
	await confirmDecision(context, write, decided);
	return decided;
}

/**
 * Confirms that a written decision still applies to the latest comparison, and repairs the check
 * run when it does not. GitHub has no conditional write for check runs, so the check comes after
 * the write.
 *
 * The backend never writes `external_id`. Only the workflows that record comparison results do, so
 * each write's response names the record the write landed on:
 *
 * - When the decision's response names another record, a publication wrote in between, and the
 *   check run gets that record's presentation back.
 * - When a re-run was requested since the pre-check, or the latest comparison cannot be read, the
 *   decision is withdrawn. The publish workflow records the newer run itself.
 *
 * It throws `409 stale` or `502 upstream` after a repair. Otherwise it mirrors the decision in the
 * sticky comment.
 */
async function confirmDecision(
	context: Context,
	write: DecisionWrite,
	decided: RestCheckRun,
): Promise<void> {
	const landed = parseExternalId(decided.external_id);
	if (!sameRecord(landed, write.externalId)) {
		await repair(context, write, decided, landed, restoration(write, landed));
		throw staleComparison();
	}
	let latest: WorkflowRun | undefined;
	try {
		latest = await latestComparison(context, write.headSha);
	} catch {
		await repair(
			context,
			write,
			decided,
			write.externalId,
			withdrawal(write, 'the comparison could not be checked'),
		);
		throw upstream('GitHub did not confirm the comparison. The decision was withdrawn. Try again.');
	}
	if (!isComparison(latest, write.externalId)) {
		await repair(
			context,
			write,
			decided,
			write.externalId,
			withdrawal(write, 'a newer comparison started'),
		);
		throw staleComparison();
	}
	// The check run is the record of the decision. The comment only mirrors it, so a failure here
	// does not fail a decision that has already been written.
	await updateCommentStatus(context, write.number, write.status).catch(() => undefined);
}

/**
 * Writes a repair meant for `target`, the record the previous response named. When the repair's
 * own response names another record, that record was written in between, so the next attempt
 * restores it instead. After the last attempt it writes `action_required`, which blocks merging
 * whatever the record is.
 */
async function repair(
	context: Context,
	write: DecisionWrite,
	previous: RestCheckRun,
	target: ExternalId | undefined,
	presentation: Presentation,
	attempt = 1,
): Promise<void> {
	const response = await presentRetrying(context, write, previous, presentation);
	const landed = parseExternalId(response.external_id);
	if (sameRecord(landed, target)) {
		await updateCommentStatus(context, write.number, presentation.title).catch(() => undefined);
		return;
	}
	const next = restoration(write, landed);
	if (attempt < MAX_REPAIR_ATTEMPTS) {
		return repair(context, write, response, landed, next, attempt + 1);
	}
	const last: Presentation = {
		...next,
		conclusion: 'action_required',
		entry: `Decision by @${write.login} withdrawn: newer results kept arriving`,
	};
	await presentRetrying(context, write, response, last);
	await updateCommentStatus(context, write.number, last.title).catch(() => undefined);
}

/**
 * Writes a presentation, trying again when the write fails. An unrepaired decision can leave a
 * failed record passing, so one failed write is not reason enough to give up.
 */
async function presentRetrying(
	context: Context,
	write: DecisionWrite,
	previous: RestCheckRun,
	presentation: Presentation,
	tries = MAX_REPAIR_TRIES,
): Promise<RestCheckRun> {
	try {
		return await present(context, write, previous, presentation);
	} catch {
		if (tries <= 1) throw upstream('GitHub did not accept the repair of the check run. Try again.');
		return presentRetrying(context, write, previous, presentation, tries - 1);
	}
}

/** Puts the check run back to `Needs review` for the record the decision was validated against. */
function withdrawal(write: DecisionWrite, why: string): Presentation {
	return {
		conclusion: 'action_required',
		entry: `Decision by @${write.login} withdrawn: ${why}`,
		summary: rewriteSummary(write.run.output.summary, NEEDS_REVIEW_STATUS),
		title: NEEDS_REVIEW_STATUS,
	};
}

/**
 * The presentation of a record that a decision or a repair overwrote. Only a `clean` record passes,
 * because its publication passed it. A record the backend cannot read blocks merging.
 */
function restoration(write: DecisionWrite, record: ExternalId | undefined): Presentation {
	const entry = `Decision by @${write.login} withdrawn: a newer result was recorded at the same time`;
	if (record?.kind === 'pending') {
		return {
			conclusion: 'action_required',
			entry,
			summary: `${statusLine(COMPARING_STATUS)}\n`,
			title: COMPARING_STATUS,
		};
	}
	const replaced = (conclusion: Presentation['conclusion'], title: string): Presentation => ({
		conclusion,
		entry,
		summary: `${statusLine(title)}\n\n${REPLACED_SUMMARY}`,
		title,
	});
	if (record?.kind === 'clean') return replaced('success', CLEAN_STATUS);
	if (record?.kind === 'failed') return replaced('failure', FAILED_STATUS);
	return replaced('action_required', NEEDS_REVIEW_STATUS);
}

/** Writes a presentation. It never sends `external_id`, so the response shows the stored record. */
function present(
	context: Context,
	write: DecisionWrite,
	previous: RestCheckRun,
	presentation: Presentation,
): Promise<RestCheckRun> {
	const { now } = write;
	return patchCheckRun(context, write.run.id, {
		completed_at: now.toISOString(),
		conclusion: presentation.conclusion,
		output: {
			summary: presentation.summary,
			text: prependHistory(previous.output.text, historyEntry(now, presentation.entry, undefined)),
			title: presentation.title,
		},
		status: 'completed',
	});
}

/** Whether two records are the same. Two records the backend cannot read count as the same. */
function sameRecord(left: ExternalId | undefined, right: ExternalId | undefined): boolean {
	return left && right ? sameExternalId(left, right) : left === right;
}

function staleComparison(): ApiError {
	return new ApiError(409, 'stale', 'A newer comparison ran on this commit. Reload the review.');
}

/** Whether a workflow run is the comparison run and attempt an external id records. */
function isComparison(
	run: WorkflowRun | undefined,
	externalId: Pick<ExternalId, 'runAttempt' | 'runId'>,
): run is WorkflowRun {
	return run?.id === externalId.runId && run.run_attempt === externalId.runAttempt;
}

async function patchCheckRun(context: Context, id: number, body: object): Promise<RestCheckRun> {
	return readGitHubJson(
		await installationFetch(context, `/repos/${context.config.repository}/check-runs/${id}`, {
			body,
			method: 'PATCH',
		}),
		restCheckRunSchema,
		'check run',
	);
}

/**
 * The latest comparison of a commit: the newest `Visual regression` run for it. A re-run keeps
 * the run id and raises its attempt as soon as it is requested.
 */
async function latestComparison(context: Context, sha: string): Promise<WorkflowRun | undefined> {
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
async function latestBaseline(context: Context): Promise<WorkflowRun | undefined> {
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

async function readDecisionBody(request: Request): Promise<z.infer<typeof decisionBodySchema>> {
	const length = Number(request.headers.get('Content-Length') ?? 0);
	if (length > MAX_BODY_BYTES) throw invalid('The request body is too large.');
	const text = await request.text();
	if (text.length > MAX_BODY_BYTES) throw invalid('The request body is too large.');
	let value: unknown;
	try {
		value = JSON.parse(text);
	} catch {
		throw invalid('The request body is not JSON.');
	}
	const parsed = decisionBodySchema.safeParse(value);
	if (!parsed.success) throw invalid('The decision is malformed.');
	const note = parsed.data.note === undefined ? '' : normalizeNote(parsed.data.note);
	if (!isValidNote(note)) throw invalid('A note is at most 500 characters of text.');
	if (parsed.data.decision === 'request-changes' && note === '') {
		throw invalid('Say what needs to change.');
	}
	return { ...parsed.data, note: note || undefined };
}

function invalid(message: string): ApiError {
	return new ApiError(400, 'invalid', message);
}

async function fetchPull(context: Context, number: number) {
	const response = await installationFetch(
		context,
		`/repos/${context.config.repository}/pulls/${number}`,
	);
	if (response.status === 404) return undefined;
	return readGitHubJson(response, pullSchema, 'pull request');
}

/** The App's `visual-review` check run on a commit. The newest wins if there is ever more than one. */
async function findCheckRun(context: Context, sha: string): Promise<RestCheckRun | undefined> {
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

function snapshot(context: Context, run: RestCheckRun): CheckRunSnapshot {
	return {
		conclusion: run.conclusion,
		externalId: run.external_id,
		headSha: run.head_sha,
		htmlUrl: run.html_url ?? `https://github.com/${context.config.repository}/runs/${run.id}`,
		title: run.output.title,
	};
}

/** Rewrites the sticky comment's status section. A pull request without one is left alone. */
async function updateCommentStatus(context: Context, number: number, status: string) {
	const author = `${await context.github.appSlug(context.config)}[bot]`;
	const comment = await findStickyComment(context, number, author, 1);
	const body = comment ? rewriteCommentStatus(comment.body ?? '', status) : undefined;
	if (!comment || body === undefined) return;
	const response = await installationFetch(
		context,
		`/repos/${context.config.repository}/issues/comments/${comment.id}`,
		{ body: { body }, method: 'PATCH' },
	);
	if (!response.ok) throw upstream(`GitHub answered ${response.status} to the comment edit.`);
}

/** Reads comment pages in order until the App's marked comment turns up. */
async function findStickyComment(
	context: Context,
	number: number,
	author: string,
	page: number,
): Promise<z.infer<typeof commentsSchema>[number] | undefined> {
	const comments = await readGitHubJson(
		await installationFetch(
			context,
			`/repos/${context.config.repository}/issues/${number}/comments?per_page=100&page=${page}`,
		),
		commentsSchema,
		'comment list',
	);
	const comment = comments.find(
		(candidate) => candidate.user?.login === author && candidate.body?.includes(COMMENT_MARKER),
	);
	if (comment || comments.length < 100 || page >= MAX_COMMENT_PAGES) return comment;
	return findStickyComment(context, number, author, page + 1);
}

function newest<T>(items: Array<T>, id: (item: T) => number): T | undefined {
	let result: T | undefined;
	for (const item of items) if (result === undefined || id(item) > id(result)) result = item;
	return result;
}
