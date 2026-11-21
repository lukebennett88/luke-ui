import { expect, test } from 'vite-plus/test';
import type { Review } from '../api/review-api.js';
import { orderByReview, reviewChip } from './pull-status.js';

function review(state: Review['state']): Review {
	return {
		baselineRunId: null,
		baselineSha: null,
		checkUrl: 'https://github.com/o/r/runs/1',
		decidedBy: null,
		headSha: 'a'.repeat(40),
		kind: 'review',
		reasons: [],
		runAttempt: 1,
		runId: 1,
		state,
	};
}

test('labels each review state, and a pull request without one', () => {
	expect(reviewChip(review('needs-review'))?.label).toBe('Needs review');
	expect(reviewChip(review('approved'))?.label).toBe('Approved');
	expect(reviewChip(review('changes-requested'))?.label).toBe('Changes requested');
	expect(reviewChip(review('clean'))?.label).toBe('No visual changes');
	expect(reviewChip(review('failed'))?.label).toBe('Comparison failed');
	expect(reviewChip(review('comparing'))?.label).toBe('Comparing');
	expect(reviewChip(null)).toBeUndefined();
});

test('puts pull requests that need review first and keeps each group’s order', () => {
	const pulls = [
		{ number: 1, review: review('approved') },
		{ number: 2, review: review('needs-review') },
		{ number: 3, review: null },
		{ number: 4 },
		{ number: 5, review: review('needs-review') },
	];

	expect(orderByReview(pulls).map((pull) => pull.number)).toEqual([2, 5, 1, 3, 4]);
});
