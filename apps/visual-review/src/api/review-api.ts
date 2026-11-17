import { z } from 'zod';

const SHA_PATTERN = /^[0-9a-f]{40}$/;
const JSON_MEDIA_TYPE_PATTERN = /^application\/json\b/i;

const sha = z.string().regex(SHA_PATTERN);
const positiveInteger = z.number().int().positive();

/**
 * The review of a pull request's head commit, as the backend reads it from the `visual-review`
 * check run. The browser redeclares the worker's contract rather than importing it.
 */
const reviewSchema = z.object({
	baselineRunId: positiveInteger.nullable(),
	baselineSha: sha.nullable(),
	checkUrl: z.url({ protocol: /^https$/ }),
	decidedBy: z.string().nullable(),
	headSha: sha,
	kind: z.enum(['clean', 'failed', 'pending', 'review']),
	reasons: z.array(z.enum(['infrastructure', 'visual'])),
	runAttempt: positiveInteger,
	runId: positiveInteger,
	state: z.enum(['approved', 'changes-requested', 'clean', 'comparing', 'failed', 'needs-review']),
});

const sessionSchema = z.union([
	z.object({ user: z.null() }),
	z.object({
		canReview: z.boolean(),
		user: z.object({ avatarUrl: z.string(), login: z.string() }),
	}),
]);

const pullReviewSchema = z.object({ headSha: sha, review: reviewSchema.nullable() });

const pullsSchema = z.object({
	pulls: z.array(
		z.object({
			author: z.string().nullable(),
			draft: z.boolean(),
			headRef: z.string(),
			headSha: sha,
			number: positiveInteger,
			review: reviewSchema.nullable(),
			title: z.string(),
			url: z.string(),
		}),
	),
});

const decisionResponseSchema = z.object({ review: reviewSchema });

const errorBodySchema = z.object({ error: z.string(), message: z.string() });

export type Review = z.infer<typeof reviewSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type PullReview = z.infer<typeof pullReviewSchema>;
export type Decision = 'approve' | 'request-changes';

/** The comparison a decision applies to. The backend refuses it once the pull request moves on. */
export type DecisionTarget = Pick<Review, 'headSha' | 'runAttempt' | 'runId'>;

/**
 * A failed request. `unavailable` means no review backend answered: the development server, a
 * deployment without its configuration, or the network. `error` is an answer from the backend.
 */
export type ApiFailure =
	| { kind: 'error'; code: string; message: string | undefined; status: number }
	| { kind: 'unavailable' };

export type ApiResult<T> = ApiFailure | { data: T; kind: 'ok' };

/** `GET /api/session`. */
export function fetchSession(): Promise<ApiResult<Session>> {
	return request('/api/session', sessionSchema);
}

/** `GET /api/pulls/<number>/review`. */
export function fetchPullReview(number: number): Promise<ApiResult<PullReview>> {
	return request(`/api/pulls/${number}/review`, pullReviewSchema);
}

/** `GET /api/pulls`. */
export function fetchPulls(): Promise<ApiResult<z.infer<typeof pullsSchema>>> {
	return request('/api/pulls', pullsSchema);
}

/** `POST /api/pulls/<number>/decision`. */
export function postDecision(
	number: number,
	body: DecisionTarget & { decision: Decision; note?: string },
): Promise<ApiResult<{ review: Review }>> {
	return request(`/api/pulls/${number}/decision`, decisionResponseSchema, {
		body: JSON.stringify(body),
		headers: { 'Content-Type': 'application/json' },
		method: 'POST',
	});
}

/** `POST /api/auth/logout`. Resolves to whether the session ended. */
export async function postLogout(): Promise<boolean> {
	try {
		const response = await fetch('/api/auth/logout', {
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json' },
			method: 'POST',
		});
		return response.ok;
	} catch {
		return false;
	}
}

/** Where sign-in starts. GitHub returns the reviewer to `returnPath`, such as `/?pr=12`. */
export function loginHref(returnPath: string): string {
	return `/api/auth/login?${new URLSearchParams({ return: returnPath })}`;
}

async function request<T>(
	path: string,
	schema: z.ZodType<T>,
	init: RequestInit = {},
): Promise<ApiResult<T>> {
	let response: Response;
	try {
		response = await fetch(path, { ...init, credentials: 'same-origin' });
	} catch {
		return { kind: 'unavailable' };
	}
	return readApiResponse(response, schema);
}

/**
 * Reads a backend response. Anything that is not the backend's JSON, such as the development
 * server's HTML fallback, counts as no backend, and so does `503 unconfigured`.
 */
export async function readApiResponse<T>(
	response: Response,
	schema: z.ZodType<T>,
): Promise<ApiResult<T>> {
	if (!JSON_MEDIA_TYPE_PATTERN.test(response.headers.get('Content-Type') ?? '')) {
		return { kind: 'unavailable' };
	}
	let body: unknown;
	try {
		body = await response.json();
	} catch {
		return { kind: 'unavailable' };
	}
	if (!response.ok) {
		const parsed = errorBodySchema.safeParse(body);
		if (parsed.success && parsed.data.error === 'unconfigured') return { kind: 'unavailable' };
		return {
			code: parsed.success ? parsed.data.error : 'unknown',
			kind: 'error',
			message: parsed.success ? parsed.data.message : undefined,
			status: response.status,
		};
	}
	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		return { code: 'invalid-response', kind: 'error', message: undefined, status: response.status };
	}
	return { data: parsed.data, kind: 'ok' };
}
