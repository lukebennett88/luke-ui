import * as z from 'zod';
import type { DecisionRequest, ErrorCode } from './contract.js';
import {
	errorBodySchema,
	errorCodeSchema,
	pullReviewResponseSchema,
	pullSummarySchema,
	pullsResponseSchema,
	reviewSchema,
	signedInSchema,
	signedOutSchema,
} from './contract.js';

const JSON_MEDIA_TYPE_PATTERN = /^application\/json\b/i;

/**
 * The contract's schemas, narrowed to the fields the app reads. A field the app does not read can
 * change without breaking it, and anything else the backend adds is dropped.
 */
const reviewReadSchema = reviewSchema.pick({
	checkUrl: true,
	decidedBy: true,
	headSha: true,
	kind: true,
	reasons: true,
	runAttempt: true,
	runId: true,
	state: true,
});

const sessionReadSchema = z.union([
	signedOutSchema,
	signedInSchema.extend({ user: signedInSchema.shape.user.pick({ login: true }) }),
]);

const pullReviewReadSchema = pullReviewResponseSchema.extend({
	review: reviewReadSchema.nullable(),
});

const pullsReadSchema = pullsResponseSchema.extend({
	pulls: z.array(
		pullSummarySchema.omit({ url: true }).extend({ review: reviewReadSchema.nullable() }),
	),
});

const decisionReadSchema = z.object({ review: reviewReadSchema });

export type Review = z.infer<typeof reviewReadSchema>;
export type Session = z.infer<typeof sessionReadSchema>;
export type PullReview = z.infer<typeof pullReviewReadSchema>;
type Pulls = z.infer<typeof pullsReadSchema>;
export type Decision = DecisionRequest['decision'];

/**
 * A failed request. `unavailable` means no review backend answered: the development server, a
 * deployment without its configuration, or the network. `error` is an answer from the backend. Its
 * `code` is `invalid-response` when a successful answer breaks the contract, and `unknown` when an
 * error carries a code this app does not know.
 */
export type ApiFailure =
	| {
			kind: 'error';
			code: ErrorCode | 'invalid-response' | 'unknown';
			message: string | undefined;
			status: number;
	  }
	| { kind: 'unavailable' };

export type ApiResult<T> = ApiFailure | { data: T; kind: 'ok' };

/** `GET /api/session`. */
export function fetchSession(): Promise<ApiResult<Session>> {
	return request('/api/session', sessionReadSchema);
}

/** `GET /api/pulls/<number>/review`. */
export function fetchPullReview(number: number): Promise<ApiResult<PullReview>> {
	return request(`/api/pulls/${number}/review`, pullReviewReadSchema);
}

/** `GET /api/pulls`. */
export function fetchPulls(): Promise<ApiResult<Pulls>> {
	return request('/api/pulls', pullsReadSchema);
}

/** `POST /api/pulls/<number>/decision`. */
export function postDecision(
	number: number,
	body: DecisionRequest,
): Promise<ApiResult<{ review: Review }>> {
	return request(`/api/pulls/${number}/decision`, decisionReadSchema, {
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
async function readApiResponse<T>(response: Response, schema: z.ZodType<T>): Promise<ApiResult<T>> {
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
		const code = errorCodeSchema.safeParse(parsed.data?.error);
		return {
			code: code.success ? code.data : 'unknown',
			kind: 'error',
			message: parsed.data?.message,
			status: response.status,
		};
	}
	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		return { code: 'invalid-response', kind: 'error', message: undefined, status: response.status };
	}
	return { data: parsed.data, kind: 'ok' };
}
