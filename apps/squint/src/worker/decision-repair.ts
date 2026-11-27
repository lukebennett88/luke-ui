import type { Context } from './access.js';
import { installationFetch } from './access.js';
import { readGitHubJson, upstream } from './github.js';
import { ApiError } from './http.js';
import type { RestCheckRun } from './repo-reads.js';
import {
	isBaseline,
	isComparison,
	latestBaseline,
	latestComparison,
	restCheckRunSchema,
} from './repo-reads.js';
import type { ExternalId } from './review.js';
import {
	COMPARING_STATUS,
	historyEntry,
	parseExternalId,
	prependHistory,
	rewriteSummary,
	sameExternalId,
	statusLine,
} from './review.js';
import type { CommentStatus } from './sticky-comment.js';

const NEEDS_REVIEW_STATUS = 'Needs review';
const CLEAN_STATUS = 'No visual changes';
const FAILED_STATUS = 'Comparison failed';
const REPLACED_SUMMARY =
	'A decision written at the same moment replaced this summary, and the review app still has the report.';
/** How many repairs follow one another before the last one blocks merging and stops. */
const MAX_REPAIR_ATTEMPTS = 3;
/** How many times one repair tries its write. */
const MAX_REPAIR_TRIES = 3;

/** A validated decision, ready to write. */
export interface DecisionWrite {
	conclusion: 'failure' | 'success';
	/** The external id the decision was validated against. */
	externalId: ExternalId;
	headSha: string;
	login: string;
	note: string | undefined;
	now: Date;
	/** The check run as it was read before the decision. */
	run: RestCheckRun;
	status: string;
}

/**
 * How a decision's write ended, with what the sticky comment should say. A `repaired` decision did
 * not stand, and the request answers with its `error`.
 */
export type DecisionOutcome =
	| { comment: CommentStatus; decided: RestCheckRun; kind: 'decided' }
	| { comment: CommentStatus; error: ApiError; kind: 'repaired' };

/** What a repair writes to the check run's conclusion, title, summary and history. */
interface Presentation {
	conclusion: 'action_required' | 'failure' | 'success';
	entry: string;
	summary: string;
	title: string;
}

/**
 * Writes the decision, then confirms it. It rejects only when GitHub did not take the decision or
 * its repair, and then the sticky comment is left alone.
 */
export async function writeDecision(
	context: Context,
	write: DecisionWrite,
): Promise<DecisionOutcome> {
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
		const error = upstream('GitHub did not record the decision. Try again.');
		const title = await repair(
			context,
			write,
			run,
			write.externalId,
			withdrawal(write, 'its write could not be confirmed'),
		).catch(() => {
			throw error;
		});
		return { comment: { status: title }, error, kind: 'repaired' };
	}
	return confirmDecision(context, write, decided);
}

/**
 * Confirms that a written decision still applies to the latest comparison, and repairs the check
 * run when it does not. GitHub has no conditional write for check runs, so the check comes after
 * the write.
 *
 * The backend never writes `external_id`. Only the publish workflow does, so each write's response
 * names the record the write landed on:
 *
 * - When the decision's response names another record, a publication wrote in between, and the
 *   check run gets that record's presentation back.
 * - When a re-run was requested or the baseline was replaced since the pre-check, or either cannot
 *   be read, the decision is withdrawn. The publish workflow records a newer run itself.
 */
async function confirmDecision(
	context: Context,
	write: DecisionWrite,
	decided: RestCheckRun,
): Promise<DecisionOutcome> {
	const landed = parseExternalId(decided.external_id);
	if (!sameRecord(landed, write.externalId)) {
		const title = await repair(context, write, decided, landed, restoration(write, landed));
		return { comment: { status: title }, error: staleComparison(), kind: 'repaired' };
	}
	const invalid = await invalidation(context, write);
	if (invalid) {
		const title = await repair(
			context,
			write,
			decided,
			write.externalId,
			withdrawal(write, invalid.reason),
		);
		return { comment: { status: title }, error: invalid.error, kind: 'repaired' };
	}
	return { comment: { note: write.note, status: write.status }, decided, kind: 'decided' };
}

/**
 * Why a written decision no longer applies, or `undefined` when it still does. It reads the latest
 * comparison and the newest baseline together. A baseline replaced since the pre-check changes no
 * record, so only its read shows it. The comparison's answer takes precedence when both fail.
 */
async function invalidation(
	context: Context,
	write: DecisionWrite,
): Promise<{ error: ApiError; reason: string } | undefined> {
	const [comparison, baseline] = await Promise.allSettled([
		latestComparison(context, write.headSha),
		latestBaseline(context),
	]);
	if (comparison.status === 'rejected') {
		return {
			error: upstream(
				'GitHub did not confirm the comparison. The decision was withdrawn. Try again.',
			),
			reason: 'the comparison could not be checked',
		};
	}
	if (!isComparison(comparison.value, write.externalId)) {
		return { error: staleComparison(), reason: 'a newer comparison started' };
	}
	if (baseline.status === 'rejected') {
		return {
			error: upstream(
				'GitHub did not confirm the baseline. The decision was withdrawn. Try again.',
			),
			reason: 'the baseline could not be checked',
		};
	}
	if (!isBaseline(baseline.value, write.externalId)) {
		return { error: staleBaseline(), reason: 'a newer baseline exists' };
	}
	return undefined;
}

/**
 * Writes a repair meant for `target`, the record the previous response named, and returns the
 * title it left. When a repair's own response names another record, that record was written in
 * between, so the next repair restores it instead. After {@link MAX_REPAIR_ATTEMPTS} repairs it
 * writes `action_required` for the last record named, which blocks merging whatever it is.
 */
async function repair(
	context: Context,
	write: DecisionWrite,
	previous: RestCheckRun,
	target: ExternalId | undefined,
	presentation: Presentation,
): Promise<string> {
	let current = presentation;
	let expected = target;
	let response = await presentRetrying(context, write, previous, current);
	for (let attempt = 1; ; attempt += 1) {
		const landed = parseExternalId(response.external_id);
		if (sameRecord(landed, expected)) return current.title;
		expected = landed;
		current = restoration(write, landed);
		const isLast = attempt === MAX_REPAIR_ATTEMPTS;
		if (isLast) {
			current = {
				...current,
				conclusion: 'action_required',
				entry: `Decision by @${write.login} withdrawn: newer results kept arriving`,
			};
		}
		// Sequential: each response decides whether another write is needed.
		// oxlint-disable-next-line no-await-in-loop
		response = await presentRetrying(context, write, response, current);
		if (isLast) return current.title;
	}
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
): Promise<RestCheckRun> {
	for (let tries = 1; ; tries += 1) {
		try {
			// Sequential: a retry follows the failure before it.
			// oxlint-disable-next-line no-await-in-loop
			return await present(context, write, previous, presentation);
		} catch {
			if (tries === MAX_REPAIR_TRIES) {
				throw upstream('GitHub did not accept the repair of the check run. Try again.');
			}
		}
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

/** Whether two records are the same. Two records the backend cannot read count as the same. */
function sameRecord(left: ExternalId | undefined, right: ExternalId | undefined): boolean {
	return left && right ? sameExternalId(left, right) : left === right;
}

export function staleComparison(): ApiError {
	return new ApiError(409, 'stale', 'A newer comparison ran on this commit. Reload the review.');
}

export function staleBaseline(): ApiError {
	return new ApiError(
		409,
		'stale-baseline',
		'A newer baseline exists. Update the branch or re-run the comparison.',
	);
}
