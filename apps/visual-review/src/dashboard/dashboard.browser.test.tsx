import axe from 'axe-core';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { json, mockApi } from '../test/mock-api.js';
import { renderApp } from '../test/render-app.js';

afterEach(() => {
	vi.restoreAllMocks();
});

function pull(number: number, review: Record<string, unknown> | null) {
	const headSha = String(number % 10).repeat(40);
	return {
		author: 'luke',
		draft: false,
		headRef: `branch-${number}`,
		headSha,
		number,
		review: review && {
			baselineRunId: null,
			baselineSha: null,
			checkUrl: `https://github.com/lukebennett88/luke-ui/runs/${number}`,
			decidedBy: null,
			headSha,
			kind: 'review',
			reasons: ['visual'],
			runAttempt: 1,
			runId: number,
			...review,
		},
		title: `Pull request ${number}`,
		url: `https://github.com/lukebennett88/luke-ui/pull/${number}`,
	};
}

test('lists pull requests that need review first, each with its review status', async () => {
	mockApi({
		'GET /api/pulls': () =>
			json({
				pulls: [
					pull(201, { state: 'approved', decidedBy: 'luke' }),
					pull(202, null),
					pull(203, { state: 'needs-review' }),
					pull(204, { kind: 'failed', reasons: [], state: 'failed' }),
				],
			}),
	});
	const app = await renderApp('');

	const rows = app.locator.getByRole('listitem');
	await expect.poll(() => rows.elements()).toHaveLength(4);
	const text = rows.elements().map((row) => row.textContent ?? '');
	expect(text[0]).toContain('#203');
	expect(text[0]).toContain('Needs review');
	expect(text[0]).toContain('No report');
	expect(text[1]).toContain('#201');
	expect(text[1]).toContain('Approved');
	expect(text[1]).toContain('No report');
	expect(text[2]).toContain('#202');
	expect(text[2]).toContain('No report');
	expect(text[3]).toContain('#204');
	expect(text[3]).toContain('Comparison failed');
	const result = await axe.run(app.container);
	expect(result.violations).toEqual([]);
});
