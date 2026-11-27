import type { PullReviewResponse } from '../api/contract.js';
import type { Context } from './access.js';
import { cachedJson } from './edge-cache.js';
import { ApiError } from './http.js';
import { fetchPull, findCheckRun, snapshot } from './repo-reads.js';
import { reviewFromCheckRun } from './review.js';

/**
 * The review is public, so signed-out visitors read it too. A short cache keeps their traffic from
 * spending the App's rate limit, and a decision purges it.
 */
const REVIEW_CACHE_SECONDS = 5;

export function reviewPath(number: number): string {
	return `/api/pulls/${number}/review`;
}

/** `GET /api/pulls/:number/review`: the review of the pull request's current head commit. */
export function getReview(context: Context, number: number): Promise<Response> {
	return cachedJson(context, reviewPath(number), REVIEW_CACHE_SECONDS, () =>
		readReview(context, number),
	);
}

async function readReview(context: Context, number: number): Promise<PullReviewResponse> {
	const pull = await fetchPull(context, number);
	if (!pull) throw new ApiError(404, 'not-found', 'There is no such pull request.');
	const run = await findCheckRun(context, pull.head.sha);
	return {
		headSha: pull.head.sha,
		review: run ? reviewFromCheckRun(snapshot(context, run)) : null,
	};
}
