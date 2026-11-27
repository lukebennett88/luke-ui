import type { DecisionRequest, DecisionResponse } from '../api/contract.js';
import { decisionRequestSchema } from '../api/contract.js';
import type { Context } from './access.js';
import { assertSameOrigin, readSession, reviewerLogin } from './access.js';
import type { DecisionOutcome, DecisionWrite } from './decision-repair.js';
import { staleBaseline, staleComparison, writeDecision } from './decision-repair.js';
import { purgeCached } from './edge-cache.js';
import { reviewPath } from './get-review.js';
import { upstream } from './github.js';
import { ApiError, json } from './http.js';
import { PULLS_PATH } from './list-pulls.js';
import {
	fetchPull,
	findCheckRun,
	isBaseline,
	isComparison,
	latestBaseline,
	latestComparison,
	snapshot,
} from './repo-reads.js';
import {
	decisionStatus,
	isValidNote,
	normalizeNote,
	parseExternalId,
	reviewFromCheckRun,
} from './review.js';
import { updateCommentStatus } from './sticky-comment.js';

const MAX_BODY_BYTES = 4096;

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

	// Every read below depends only on the request, so they run together. Their results are checked
	// in a fixed order, so the answer depends on which check fails first, not which read finishes
	// first.
	const [access, pull, run, baseline, comparison] = await Promise.allSettled([
		reviewerLogin(context, reviewer),
		fetchPull(context, number),
		findCheckRun(context, body.headSha),
		latestBaseline(context),
		latestComparison(context, body.headSha),
	]);
	const login = settledValue(access);
	if (!login) {
		throw new ApiError(403, 'forbidden', 'Reviewing needs write access to the repository.');
	}
	const openPull = settledValue(pull);
	if (openPull?.state !== 'open') {
		throw new ApiError(404, 'not-found', 'The pull request is not open.');
	}
	if (openPull.head.sha !== body.headSha) {
		throw new ApiError(409, 'stale', 'The pull request has a newer commit. Reload the review.');
	}
	const checkRun = settledValue(run);
	const externalId = checkRun ? parseExternalId(checkRun.external_id) : undefined;
	if (!checkRun || !externalId) {
		throw new ApiError(404, 'not-found', 'The commit has no visual review check.');
	}
	if (checkRun.status !== 'completed' || externalId.kind !== 'review') {
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
	if (!isBaseline(settledValue(baseline), externalId)) throw staleBaseline();
	const latest = settledValue(comparison);
	if (
		!isComparison(latest, externalId) ||
		latest.status !== 'completed' ||
		latest.conclusion !== 'success'
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
		run: checkRun,
		status: decisionStatus(body.decision, login),
	};
	// The write starts after a microtask, so `waitUntil` holds it before any request leaves. A client
	// that disconnects then cannot cancel the decision between its write and its repair.
	const outcome = Promise.resolve().then(() => writeDecision(context, write));
	context.waitUntil(afterDecision(context, number, outcome));
	const result = await outcome;
	if (result.kind === 'repaired') throw result.error;

	const review = reviewFromCheckRun(snapshot(context, result.decided));
	if (!review) throw upstream('GitHub sent back a check run without its external id.');
	return json({ review } satisfies DecisionResponse);
}

/**
 * The work that follows a decision, after the response: it purges the cached reviews and mirrors
 * the outcome in the sticky comment. The check run is the record of the decision, and the comment
 * only mirrors it, so a failure here changes nothing the reviewer was told. It never rejects.
 */
async function afterDecision(
	context: Context,
	number: number,
	outcome: Promise<DecisionOutcome>,
): Promise<void> {
	const result = await outcome.catch(() => undefined);
	await Promise.all([purgeCached(context, reviewPath(number)), purgeCached(context, PULLS_PATH)]);
	if (!result) return;
	await updateCommentStatus(context, number, result.comment).catch(() => undefined);
}

/** The value of a settled read, or its failure thrown. */
function settledValue<T>(result: PromiseSettledResult<T>): T {
	if (result.status === 'rejected') throw result.reason;
	return result.value;
}

async function readDecisionBody(request: Request): Promise<DecisionRequest> {
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
	const parsed = decisionRequestSchema.safeParse(value);
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
