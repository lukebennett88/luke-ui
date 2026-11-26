import * as z from 'zod';
import type { Decision, Review } from '../api/contract.js';
import { positiveIntegerSchema, reviewSchema, shaSchema } from '../api/contract.js';

/** The check run's name. One per head commit, written by the publish workflow. */
export const CHECK_NAME = 'visual-review';
/** Identifies the sticky pull request comment, with its `<slug>[bot]` author. */
export const COMMENT_MARKER = '<!-- luke-ui-visual-review -->';

const MAX_HISTORY_ENTRIES = 50;
/** GitHub limits `output.text` and `output.summary` to 65,535 characters. */
const MAX_OUTPUT_LENGTH = 60_000;
const HISTORY_HEADING = '### History';
const MAX_NOTE_LENGTH = 500;
const STATUS_PREFIX = '**Status:** ';
const STATUS_SECTION_PATTERN =
	/<!-- visual-review-status -->[\s\S]*?<!-- \/visual-review-status -->/;
const DECIDED_TITLE_PATTERN = /^(?:Approved|Changes requested) by @([A-Za-z0-9-]{1,39})$/;
const WHITESPACE_RUN_PATTERN = /\s+/g;
const CONTROL_CHARACTER_PATTERN = /\p{Cc}/u;

const externalIdSchema = z.object({
	// Written since revision 2.1. An external id without it has an unverified baseline.
	baselineRunAttempt: positiveIntegerSchema.nullable().default(null),
	baselineRunId: positiveIntegerSchema.nullable(),
	baselineSha: shaSchema.nullable(),
	kind: reviewSchema.shape.kind,
	reasons: reviewSchema.shape.reasons,
	runAttempt: positiveIntegerSchema,
	runId: positiveIntegerSchema,
	v: z.literal(1),
});

export type ExternalId = z.infer<typeof externalIdSchema>;
type ReviewState = Review['state'];

/** The fields of a check run, from REST or GraphQL, that a `Review` reads. */
export interface CheckRunSnapshot {
	/** Lower case, as REST spells it. */
	conclusion: string | null;
	externalId: string | null;
	headSha: string;
	htmlUrl: string;
	title: string | null;
}

/** Whether two external ids record the same comparison, baseline and outcome. */
export function sameExternalId(left: ExternalId, right: ExternalId): boolean {
	return (
		left.kind === right.kind &&
		left.runId === right.runId &&
		left.runAttempt === right.runAttempt &&
		left.baselineRunId === right.baselineRunId &&
		left.baselineRunAttempt === right.baselineRunAttempt &&
		left.baselineSha === right.baselineSha &&
		left.reasons.join() === right.reasons.join()
	);
}

/** Parses the publish workflow's v1 `external_id`, or returns `undefined` for anything else. */
export function parseExternalId(value: string | null): ExternalId | undefined {
	if (!value) return undefined;
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		return undefined;
	}
	const result = externalIdSchema.safeParse(parsed);
	return result.success ? result.data : undefined;
}

/** Maps a `visual-review` check run to a `Review`, or `null` when its `external_id` is not v1. */
export function reviewFromCheckRun(run: CheckRunSnapshot): Review | null {
	const externalId = parseExternalId(run.externalId);
	if (!externalId) return null;
	const state = reviewState(externalId.kind, run.conclusion, run.title);
	const decided = state === 'approved' || state === 'changes-requested';
	return {
		baselineRunAttempt: externalId.baselineRunAttempt,
		baselineRunId: externalId.baselineRunId,
		baselineSha: externalId.baselineSha,
		checkUrl: run.htmlUrl,
		decidedBy: decided ? (DECIDED_TITLE_PATTERN.exec(run.title ?? '')?.[1] ?? null) : null,
		headSha: run.headSha,
		kind: externalId.kind,
		reasons: externalId.reasons,
		runAttempt: externalId.runAttempt,
		runId: externalId.runId,
		state,
	};
}

/**
 * A check run can fail without a new record, because only the publish workflow writes
 * `external_id`. A failure on a `clean` or `pending` record, or on a `review` record without a
 * decision's title, is therefore a failed result and not a request for changes. A `review` or
 * `clean` record can likewise be blocked for a newer comparison that is not recorded yet, and a
 * `clean` record passes only with the `success` conclusion.
 */
function reviewState(
	kind: ExternalId['kind'],
	conclusion: string | null,
	title: string | null,
): ReviewState {
	if (kind === 'failed') return 'failed';
	if (conclusion === 'failure') {
		return kind === 'review' && DECIDED_TITLE_PATTERN.test(title ?? '')
			? 'changes-requested'
			: 'failed';
	}
	if (kind === 'pending') return 'comparing';
	if (conclusion === 'success') return kind === 'clean' ? 'clean' : 'approved';
	if (title === COMPARING_STATUS) return 'comparing';
	return kind === 'clean' ? 'failed' : 'needs-review';
}

/** The status text a decision writes to the title, the summary and the comment. */
export function decisionStatus(decision: Decision, login: string): string {
	return decision === 'approve' ? `Approved by @${login}` : `Changes requested by @${login}`;
}

/** The status text of a check run that is waiting for its comparison. */
export const COMPARING_STATUS = 'Comparing';

/** The first line of a check run's summary and the sticky comment's status section. */
export function statusLine(status: string): string {
	return `${STATUS_PREFIX}${status}`;
}

/**
 * Replaces the summary's first line, the status line, and keeps the rest, cut to 60,000
 * characters.
 */
export function rewriteSummary(summary: string | null, status: string): string {
	const line = statusLine(status);
	if (!summary) return line;
	const newline = summary.indexOf('\n');
	const firstLine = newline === -1 ? summary : summary.slice(0, newline);
	let result: string;
	if (!firstLine.startsWith(STATUS_PREFIX)) result = `${line}\n\n${summary}`;
	else result = newline === -1 ? line : `${line}${summary.slice(newline)}`;
	return result.slice(0, MAX_OUTPUT_LENGTH);
}

/**
 * Prepends an entry to the check run's history, newest first. It drops the oldest entries until
 * at most 50 remain and the text is at most 60,000 characters.
 */
export function prependHistory(text: string | null, entry: string): string {
	const entries = [entry, ...(text ?? '').split('\n').filter((line) => line.startsWith('- '))];
	entries.length = Math.min(entries.length, MAX_HISTORY_ENTRIES);
	// The heading, a blank line, then one line per entry.
	let length = HISTORY_HEADING.length + 1;
	let kept = 0;
	for (const line of entries) {
		if (length + 1 + line.length > MAX_OUTPUT_LENGTH) break;
		length += 1 + line.length;
		kept += 1;
	}
	return [HISTORY_HEADING, '', ...entries.slice(0, kept)].join('\n');
}

export function historyEntry(date: Date, status: string, note: string | undefined): string {
	return `- ${formatTimestamp(date)} · ${status}${note ? `: ${escapeNote(note)}` : ''}`;
}

/** `YYYY-MM-DD HH:MM UTC`. */
function formatTimestamp(date: Date): string {
	return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

/** Collapses whitespace to single spaces and trims. */
export function normalizeNote(value: string): string {
	return value.replaceAll(WHITESPACE_RUN_PATTERN, ' ').trim();
}

export function isValidNote(note: string): boolean {
	return note.length <= MAX_NOTE_LENGTH && !CONTROL_CHARACTER_PATTERN.test(note);
}

function escapeNote(note: string): string {
	return note.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/**
 * Rewrites the status section of the sticky comment, or returns `undefined` when the comment has
 * none.
 */
export function rewriteCommentStatus(
	body: string,
	status: string,
	note?: string,
): string | undefined {
	if (!STATUS_SECTION_PATTERN.test(body)) return undefined;
	const message = note ? `\n\n**Note:**\n\n<pre>${escapeNote(note)}</pre>` : '';
	return body.replace(
		STATUS_SECTION_PATTERN,
		() =>
			`<!-- visual-review-status -->\n${statusLine(status)}${message}\n<!-- /visual-review-status -->`,
	);
}
