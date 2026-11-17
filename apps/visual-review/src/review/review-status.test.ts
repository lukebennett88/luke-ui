import { expect, test } from 'vite-plus/test';
import type { Review } from '../api/review-api.js';
import type { Report } from '../report/schema.js';
import { decisionErrorMessage, isReportCurrent, reviewStatusText } from './review-status.js';

const HEAD_SHA = 'a'.repeat(40);

const REVIEW: Review = {
	baselineRunId: null,
	baselineSha: null,
	checkUrl: 'https://github.com/o/r/runs/1',
	decidedBy: null,
	headSha: HEAD_SHA,
	kind: 'review',
	reasons: ['visual'],
	runAttempt: 2,
	runId: 34,
	state: 'needs-review',
};

function report(meta: Partial<NonNullable<Report['meta']>>): Report {
	return {
		captures: [],
		counts: { added: 0, changed: 0, removed: 0, unchanged: 0 },
		meta: { generatedAt: '', headSha: HEAD_SHA, pullRequest: 1, runAttempt: 2, runId: 34, ...meta },
	};
}

test('names the reviewer of a decision', () => {
	expect(reviewStatusText({ ...REVIEW, decidedBy: 'luke', state: 'approved' })).toBe(
		'Approved by @luke',
	);
	expect(reviewStatusText({ ...REVIEW, decidedBy: 'luke', state: 'changes-requested' })).toBe(
		'Changes requested by @luke',
	);
	expect(reviewStatusText({ ...REVIEW, state: 'approved' })).toBe('Approved');
});

test('describes reviews without a decision', () => {
	expect(reviewStatusText(REVIEW)).toBe('Needs review');
	expect(reviewStatusText({ ...REVIEW, kind: 'clean', state: 'clean' })).toBe('No visual changes');
	expect(reviewStatusText({ ...REVIEW, kind: 'failed', state: 'failed' })).toBe(
		'Comparison failed',
	);
	expect(reviewStatusText({ ...REVIEW, kind: 'pending', state: 'comparing' })).toBe('Comparing');
	expect(reviewStatusText(null)).toBe('Not compared yet');
});

test('a report is current only for the review’s commit, run, and attempt', () => {
	expect(isReportCurrent(report({}), REVIEW)).toBe(true);
	expect(isReportCurrent(report({ headSha: 'b'.repeat(40) }), REVIEW)).toBe(false);
	expect(isReportCurrent(report({ runId: 35 }), REVIEW)).toBe(false);
	expect(isReportCurrent(report({ runAttempt: 1 }), REVIEW)).toBe(false);
	expect(isReportCurrent({ ...report({}), meta: undefined }, REVIEW)).toBe(false);
	expect(isReportCurrent(undefined, REVIEW)).toBe(false);
});

const FAILURES = [
	[
		{ code: 'stale', status: 409 },
		'A newer commit or comparison exists. Reload the page to review it.',
	],
	[{ code: 'unauthenticated', status: 401 }, 'Your sign-in has ended. Sign in again to review.'],
	[{ code: 'forbidden', status: 403 }, 'Reviewing needs write access to the repository.'],
	[{ code: 'bad-origin', status: 403 }, 'The decision could not be saved. Try again.'],
	[{ code: 'upstream', status: 502 }, 'The decision could not be saved. Try again.'],
	[
		{ code: 'unverified-baseline', status: 409 },
		'The baseline for this comparison could not be verified. Re-run the comparison.',
	],
	[
		{ code: 'stale-baseline', status: 409 },
		'The baseline on main has changed. Update the branch to compare against it.',
	],
] as const;

for (const [failure, message] of FAILURES) {
	test(`explains a ${failure.status} ${failure.code} decision`, () => {
		expect(decisionErrorMessage({ ...failure, kind: 'error', message: undefined })).toBe(message);
	});
}

test('explains a decision that reached no backend', () => {
	expect(decisionErrorMessage({ kind: 'unavailable' })).toBe(
		'The review service could not be reached. Try again.',
	);
});
