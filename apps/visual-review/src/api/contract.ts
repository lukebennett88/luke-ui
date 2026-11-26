import * as z from 'zod';

/**
 * The review backend's HTTP contract. The worker types its responses with these schemas, and the
 * browser parses the responses with them, so both sides read one declaration. This module imports
 * nothing but `zod`, so it runs in both.
 */

const SHA_PATTERN = /^[0-9a-f]{40}$/;
const HTTPS_PROTOCOL_PATTERN = /^https$/;

export const shaSchema = z.string().regex(SHA_PATTERN);
export const positiveIntegerSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);

/** The `error` of every failed response. */
export const errorCodeSchema = z.enum([
	'bad-origin',
	'forbidden',
	'internal',
	'invalid',
	'method-not-allowed',
	'not-found',
	'not-reviewable',
	'stale',
	'stale-baseline',
	'unauthenticated',
	'unconfigured',
	'unverified-baseline',
	'upstream',
]);

export type ErrorCode = z.infer<typeof errorCodeSchema>;

/**
 * The body of every failed response. The browser reads `error` as a string, so a code it does not
 * know yet still carries its message.
 */
export const errorBodySchema = z.object({ error: z.string(), message: z.string() });

export type ErrorBody = { error: ErrorCode; message: string };

/**
 * The review of a pull request's head commit, as the backend reads it from the `visual-review`
 * check run.
 */
export const reviewSchema = z.object({
	baselineRunAttempt: positiveIntegerSchema.nullable(),
	baselineRunId: positiveIntegerSchema.nullable(),
	baselineSha: shaSchema.nullable(),
	checkUrl: z.url({ protocol: HTTPS_PROTOCOL_PATTERN }),
	decidedBy: z.string().nullable(),
	headSha: shaSchema,
	kind: z.enum(['clean', 'failed', 'pending', 'review']),
	reasons: z.array(z.enum(['infrastructure', 'visual'])),
	runAttempt: positiveIntegerSchema,
	runId: positiveIntegerSchema,
	state: z.enum(['approved', 'changes-requested', 'clean', 'comparing', 'failed', 'needs-review']),
});

export type Review = z.infer<typeof reviewSchema>;

/** `GET /api/pulls/<number>/review`. */
export const pullReviewResponseSchema = z.object({
	headSha: shaSchema,
	review: reviewSchema.nullable(),
});

export type PullReviewResponse = z.infer<typeof pullReviewResponseSchema>;

/** One open pull request in `GET /api/pulls`. */
export const pullSummarySchema = z.object({
	author: z.string().nullable(),
	draft: z.boolean(),
	headRef: z.string(),
	headSha: shaSchema,
	number: positiveIntegerSchema,
	review: reviewSchema.nullable(),
	title: z.string(),
	url: z.string(),
});

/** `GET /api/pulls`. */
export const pullsResponseSchema = z.object({ pulls: z.array(pullSummarySchema) });

export type PullsResponse = z.infer<typeof pullsResponseSchema>;

export const signedOutSchema = z.object({ user: z.null() });

export const signedInSchema = z.object({
	canReview: z.boolean(),
	user: z.object({ avatarUrl: z.string(), login: z.string() }),
});

/** `GET /api/session`. */
export type SessionResponse = z.infer<typeof signedOutSchema> | z.infer<typeof signedInSchema>;

const decisionSchema = z.enum(['approve', 'request-changes']);

export type Decision = z.infer<typeof decisionSchema>;

/** The body of `POST /api/pulls/<number>/decision`. */
export const decisionRequestSchema = z.object({
	decision: decisionSchema,
	headSha: shaSchema,
	note: z.string().optional(),
	runAttempt: positiveIntegerSchema,
	runId: positiveIntegerSchema,
});

export type DecisionRequest = z.infer<typeof decisionRequestSchema>;

/** `POST /api/pulls/<number>/decision`. */
export type DecisionResponse = { review: Review };
