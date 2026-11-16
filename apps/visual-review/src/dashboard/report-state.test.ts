import { expect, test } from 'vite-plus/test';
import type { ReportResult } from '../report/load-report.js';
import { reportState } from './report-state.js';

const HEAD_SHA = 'a'.repeat(40);

function ready(counts: { added: number; changed: number; removed: number }, headSha?: string) {
	return {
		baseUrl: 'https://pr-12.example.pages.dev',
		report: {
			captures: [],
			counts: { ...counts, unchanged: 300 },
			meta: headSha
				? { generatedAt: '', headSha, pullRequest: 12, runAttempt: 1, runId: 34 }
				: undefined,
		},
		status: 'ready',
	} satisfies ReportResult;
}

test('counts the differences of a report for the head commit', () => {
	const state = reportState(ready({ added: 1, changed: 4, removed: 0 }, HEAD_SHA), HEAD_SHA);

	expect(state).toEqual({ added: 1, changed: 4, kind: 'differences', removed: 0 });
});

test('reports no differences when nothing differs', () => {
	const state = reportState(ready({ added: 0, changed: 0, removed: 0 }, HEAD_SHA), HEAD_SHA);

	expect(state).toEqual({ kind: 'no-differences' });
});

test('treats a report for an older commit as out of date', () => {
	const state = reportState(ready({ added: 0, changed: 4, removed: 0 }, 'b'.repeat(40)), HEAD_SHA);

	expect(state).toEqual({ kind: 'out-of-date' });
});

for (const status of ['missing', 'invalid'] as const) {
	test(`has no report when loading it is ${status}`, () => {
		expect(reportState({ status }, HEAD_SHA)).toEqual({ kind: 'no-report' });
	});
}

test('says so when the build has no data source', () => {
	expect(reportState({ status: 'unconfigured' }, HEAD_SHA)).toEqual({ kind: 'unconfigured' });
});
