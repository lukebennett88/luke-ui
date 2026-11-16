import { z } from 'zod';
import type { Context } from './access.js';
import { assertSameOrigin, canReview, installationFetch, readSession } from './access.js';
import { readGitHubJson, upstream } from './github.js';
import { ApiError, json } from './http.js';
import type { CheckRunSnapshot, Review } from './review.js';
import {
	CHECK_NAME,
	COMMENT_MARKER,
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
	shaSchema,
} from './review.js';

const PULLS_CACHE_SECONDS = 30;
const MAX_BODY_BYTES = 4096;
const MAX_COMMENT_PAGES = 10;

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
 * then updates the sticky comment's status. Each check fails before anything is written.
 */
export async function decide(context: Context, number: number): Promise<Response> {
	const reviewer = await readSession(context);
	if (!reviewer) throw new ApiError(401, 'unauthenticated', 'Sign in to review.');
	assertSameOrigin(context);
	const body = await readDecisionBody(context.request);
	if (!(await canReview(context, reviewer.login))) {
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
	if (externalId.kind !== 'review') {
		throw new ApiError(409, 'not-reviewable', 'This comparison has nothing to review.');
	}
	if (externalId.runId !== body.runId || externalId.runAttempt !== body.runAttempt) {
		throw new ApiError(409, 'stale', 'A newer comparison ran on this commit. Reload the review.');
	}

	const status = decisionStatus(body.decision, reviewer.login);
	const now = new Date(context.deps.now());
	const updated = await readGitHubJson(
		await installationFetch(context, `/repos/${context.config.repository}/check-runs/${run.id}`, {
			body: {
				completed_at: now.toISOString(),
				conclusion: body.decision === 'approve' ? 'success' : 'failure',
				output: {
					summary: rewriteSummary(run.output.summary, status),
					text: prependHistory(run.output.text, historyEntry(now, status, body.note)),
					title: status,
				},
				status: 'completed',
			},
			method: 'PATCH',
		}),
		restCheckRunSchema,
		'check run',
	);
	// The check run is the record of the decision. The comment only mirrors it, so a failure here
	// does not fail a decision that has already been written.
	await updateCommentStatus(context, number, status).catch(() => undefined);

	const review = reviewFromCheckRun(snapshot(context, updated));
	if (!review) throw upstream('GitHub sent back a check run without its external id.');
	return json({ review });
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
