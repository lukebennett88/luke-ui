import type { ApiFailure, Review } from '../api/review-api.js';
import type { Report } from '../report/schema.js';

/** The review's status as one line, such as `Approved by @luke`. */
export function reviewStatusText(review: Review | null): string {
	if (!review) return 'Not compared yet';
	switch (review.state) {
		case 'approved':
			return review.decidedBy ? `Approved by @${review.decidedBy}` : 'Approved';
		case 'changes-requested':
			return review.decidedBy ? `Changes requested by @${review.decidedBy}` : 'Changes requested';
		case 'clean':
			return 'No visual changes';
		case 'failed':
			return 'Comparison did not finish';
		case 'needs-review':
			return 'Needs review';
	}
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

/** What to tell a reviewer when a decision fails. */
export function decisionErrorMessage(failure: ApiFailure): string {
	if (failure.kind === 'unavailable') {
		return 'The review service could not be reached. Try again.';
	}
	if (failure.code === 'stale') {
		return 'A newer commit or comparison exists. Reload the page to review it.';
	}
	if (failure.status === 401) return 'Your sign-in has ended. Sign in again to review.';
	if (failure.code === 'forbidden') return 'Reviewing needs write access to the repository.';
	if (failure.code === 'not-reviewable') return 'This comparison has nothing to review.';
	return 'The decision could not be saved. Try again.';
}
