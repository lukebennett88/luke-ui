import type { IconName } from '@luke-ui/react/icon';
import type { ErrorCode } from '../api/contract.js';
import type { ApiFailure, Review } from '../api/review-api.js';
import type { Report } from '../report/schema.js';

/** The text colours a review's status is shown in. */
type StatusTone = 'danger' | 'secondary' | 'success' | 'warning';

/** How a review's state reads, wherever the app shows it. */
type ReviewStatus = {
	/** Shown before the label. Only a decision has one. */
	icon: IconName | undefined;
	/** Whether the state is a reviewer's decision, so its text names who made it. */
	isDecision: boolean;
	label: string;
	/** The label in a phone's top bar. */
	shortLabel: string;
	tone: StatusTone;
};

/** Every review state's label, colour, and icon. The dashboard and the review page both read it. */
export const REVIEW_STATUSES = {
	approved: {
		icon: 'check',
		isDecision: true,
		label: 'Approved',
		shortLabel: 'Approved',
		tone: 'success',
	},
	'changes-requested': {
		icon: 'exclamationTriangle',
		isDecision: true,
		label: 'Changes requested',
		shortLabel: 'Changes',
		tone: 'danger',
	},
	clean: {
		icon: undefined,
		isDecision: false,
		label: 'No visual changes',
		shortLabel: 'No visual changes',
		tone: 'secondary',
	},
	comparing: {
		icon: undefined,
		isDecision: false,
		label: 'Comparing',
		shortLabel: 'Comparing',
		tone: 'secondary',
	},
	failed: {
		icon: undefined,
		isDecision: false,
		label: 'Comparison failed',
		shortLabel: 'Comparison failed',
		tone: 'danger',
	},
	'needs-review': {
		icon: undefined,
		isDecision: false,
		label: 'Needs review',
		shortLabel: 'Needs review',
		tone: 'warning',
	},
} as const satisfies Record<Review['state'], ReviewStatus>;

/** The review's status as one line, such as `Approved by @luke`. */
export function reviewStatusText(review: Review | null): string {
	if (!review) return 'No review check yet';
	const { isDecision, label } = REVIEW_STATUSES[review.state];
	return isDecision && review.decidedBy ? `${label} by @${review.decidedBy}` : label;
}

/**
 * Whether the loaded report is the comparison the review describes. A decision applies to the
 * review's comparison, so a reviewer must be looking at that report to make one.
 */
export function isReportCurrent(report: Report | undefined, review: Review): boolean {
	const meta = report?.meta;
	if (!meta) return false;
	return (
		meta.headSha === review.headSha &&
		meta.runId === review.runId &&
		meta.runAttempt === review.runAttempt
	);
}

const SAVE_FAILED = 'The decision could not be saved. Try again.';

/**
 * What to tell a reviewer when the backend refuses a decision, by its error code. A code the
 * contract adds fails type-checking here until it has a message.
 */
export const DECISION_ERROR_MESSAGES = {
	'bad-origin': SAVE_FAILED,
	forbidden: 'Reviewing needs write access to the repository.',
	internal: SAVE_FAILED,
	invalid: SAVE_FAILED,
	'method-not-allowed': SAVE_FAILED,
	'not-found': SAVE_FAILED,
	'not-reviewable': 'This comparison has nothing to review.',
	stale: 'A newer commit or comparison exists. Reload the page to review it.',
	'stale-baseline': 'The baseline on main has changed. Update the branch to compare against it.',
	unauthenticated: 'Your sign-in has ended. Sign in again to review.',
	unconfigured: SAVE_FAILED,
	'unverified-baseline':
		'The baseline for this comparison could not be verified. Re-run the comparison.',
	upstream: SAVE_FAILED,
} as const satisfies Record<ErrorCode, string>;

const FINAL_REFUSALS = [
	'not-reviewable',
	'stale',
	'stale-baseline',
	'unverified-baseline',
] as const;

/** A refusal that holds for every decision on the report on screen, until the page reloads. */
export type FinalRefusal = (typeof FINAL_REFUSALS)[number];

export function finalRefusal(code: string): FinalRefusal | undefined {
	return FINAL_REFUSALS.find((refusal) => refusal === code);
}

/** What to tell a reviewer when a decision fails. */
export function decisionErrorMessage(failure: ApiFailure): string {
	if (failure.kind === 'unavailable') {
		return 'The review service could not be reached. Try again.';
	}
	if (failure.code === 'invalid-response' || failure.code === 'unknown') {
		// A 401 means the session has ended, even without a code this app knows.
		return failure.status === 401 ? DECISION_ERROR_MESSAGES.unauthenticated : SAVE_FAILED;
	}
	return DECISION_ERROR_MESSAGES[failure.code];
}
