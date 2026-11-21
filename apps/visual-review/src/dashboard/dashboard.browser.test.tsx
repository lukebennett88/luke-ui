import axe from 'axe-core';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { json, mockApi, publishedReport } from '../test/mock-api.js';
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
					pull(205, null),
				],
			}),
		// A report for the head commit, but no review check run.
		'GET https://pr-205.reports.test/summary.json': () =>
			publishedReport(205, { headSha: '5'.repeat(40), runAttempt: 1, runId: 205 }),
	});
	const app = await renderApp('');

	const rows = app.locator.getByRole('list', { name: 'Open pull requests' }).getByRole('listitem');
	await expect.poll(() => rows.elements()).toHaveLength(5);
	await expect
		.element(rows.nth(4).getByRole('link', { name: /^#205 Pull request 205.*Review$/ }))
		.toHaveAttribute('href', '?pr=205');
	await expect
		.element(rows.nth(0).getByRole('link', { name: /^#203 Pull request 203.*Open on GitHub$/ }))
		.toHaveAttribute('href', 'https://github.com/lukebennett88/luke-ui/pull/203');
	for (const row of rows.elements()) {
		expect(row.querySelectorAll('a')).toHaveLength(1);
	}
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
	expect(text[4]).toContain('#205');
	expect(text[4]).toContain('4 changed');
	expect(text[4]).not.toContain('No report');
	const result = await axe.run(app.container);
	expect(result.violations).toEqual([]);

	const local = app.locator.getByRole('region', { name: 'On this machine' });
	await expect
		.element(local.getByRole('link', { name: /^Local comparison.*Review$/ }))
		.toHaveAttribute('href', '?source=local');
	expect(local.getByRole('link').elements()).toHaveLength(1);
	await app.user.click(local.getByText('.artifacts/visual-regression'));
	await expect
		.element(app.locator.getByRole('heading', { name: 'Local comparison' }))
		.toBeVisible();
});
