import { describe, expect, test } from 'vite-plus/test';
import type { CheckRunSnapshot } from './review.js';
import {
	historyEntry,
	normalizeNote,
	parseExternalId,
	prependHistory,
	reviewFromCheckRun,
	rewriteCommentStatus,
	rewriteSummary,
} from './review.js';

const HEAD = 'a'.repeat(40);
const BASELINE = 'b'.repeat(40);

function externalId(overrides: Record<string, unknown> = {}): string {
	return JSON.stringify({
		baselineRunId: 456,
		baselineSha: BASELINE,
		kind: 'review',
		reasons: ['visual'],
		runAttempt: 1,
		runId: 123,
		v: 1,
		...overrides,
	});
}

function run(overrides: Partial<CheckRunSnapshot> = {}): CheckRunSnapshot {
	return {
		conclusion: 'action_required',
		externalId: externalId(),
		headSha: HEAD,
		htmlUrl: 'https://github.com/octo/widgets/runs/900',
		title: 'Needs review: 3 changed',
		...overrides,
	};
}

describe('parseExternalId', () => {
	test('reads a v1 external id', () => {
		expect(parseExternalId(externalId({ baselineRunId: null, baselineSha: null }))).toEqual({
			baselineRunId: null,
			baselineSha: null,
			kind: 'review',
			reasons: ['visual'],
			runAttempt: 1,
			runId: 123,
			v: 1,
		});
	});

	const rejected = [
		['no value', null],
		['text that is not JSON', 'run-123'],
		['another version', externalId({ v: 2 })],
		['an unknown kind', externalId({ kind: 'pending' })],
		['an unknown reason', externalId({ reasons: ['flaky'] })],
		['a fractional run id', externalId({ runId: 1.5 })],
		['a short baseline sha', externalId({ baselineSha: 'abc' })],
	] as const;
	for (const [description, value] of rejected) {
		test(`rejects ${description}`, () => {
			expect(parseExternalId(value)).toBeUndefined();
		});
	}
});

describe('reviewFromCheckRun', () => {
	test('maps an undecided review', () => {
		expect(reviewFromCheckRun(run())).toEqual({
			baselineRunId: 456,
			baselineSha: BASELINE,
			checkUrl: 'https://github.com/octo/widgets/runs/900',
			decidedBy: null,
			headSha: HEAD,
			kind: 'review',
			reasons: ['visual'],
			runAttempt: 1,
			runId: 123,
			state: 'needs-review',
		});
	});

	const states = [
		['review', 'success', 'Approved by @luke', 'approved', 'luke'],
		['review', 'failure', 'Changes requested by @mona-l', 'changes-requested', 'mona-l'],
		['clean', 'success', 'No visual changes', 'clean', null],
		['failed', 'failure', 'Comparison did not finish', 'failed', null],
	] as const;
	for (const [kind, conclusion, title, state, decidedBy] of states) {
		test(`maps ${kind} with ${conclusion} to ${state}`, () => {
			const review = reviewFromCheckRun(
				run({ conclusion, externalId: externalId({ kind }), title }),
			);
			expect(review).toMatchObject({ decidedBy, kind, state });
		});
	}

	test('is null when the external id is not v1', () => {
		expect(reviewFromCheckRun(run({ externalId: 'legacy' }))).toBeNull();
	});
});

describe('rewriteSummary', () => {
	test('replaces only the status line', () => {
		expect(rewriteSummary('**Status:** Needs review\n\n| Changed | 3 |', 'Approved by @luke')).toBe(
			'**Status:** Approved by @luke\n\n| Changed | 3 |',
		);
	});

	test('adds a status line to a summary without one', () => {
		expect(rewriteSummary('| Changed | 3 |', 'Approved by @luke')).toBe(
			'**Status:** Approved by @luke\n\n| Changed | 3 |',
		);
	});

	test('writes the status line alone to an empty summary', () => {
		expect(rewriteSummary(null, 'Approved by @luke')).toBe('**Status:** Approved by @luke');
	});
});

describe('prependHistory', () => {
	test('puts the new entry first and keeps earlier entries', () => {
		const text =
			'### History\n\n- 2026-11-16 03:22 UTC · Comparison run 123 (attempt 1): needs review';
		expect(prependHistory(text, '- 2026-11-16 03:40 UTC · Approved by @luke')).toBe(
			'### History\n\n- 2026-11-16 03:40 UTC · Approved by @luke\n- 2026-11-16 03:22 UTC · Comparison run 123 (attempt 1): needs review',
		);
	});

	test('keeps the newest 50 entries', () => {
		const old = Array.from({ length: 50 }, (_, index) => `- entry ${index}`);
		const lines = prependHistory(`### History\n\n${old.join('\n')}`, '- newest').split('\n');
		expect(lines.slice(2)).toEqual(['- newest', ...old.slice(0, 49)]);
	});

	test('starts a history when there is none', () => {
		expect(prependHistory(null, '- first')).toBe('### History\n\n- first');
	});
});

describe('historyEntry', () => {
	const date = new Date('2026-11-16T03:35:59Z');

	test('formats the time in UTC to the minute', () => {
		expect(historyEntry(date, 'Approved by @luke', undefined)).toBe(
			'- 2026-11-16 03:35 UTC · Approved by @luke',
		);
	});

	test('escapes markup in the note', () => {
		expect(historyEntry(date, 'Changes requested by @luke', 'Fix <b> & tidy')).toBe(
			'- 2026-11-16 03:35 UTC · Changes requested by @luke: Fix &lt;b&gt; &amp; tidy',
		);
	});
});

test('normalizeNote collapses whitespace and trims', () => {
	expect(normalizeNote('  Fix the\n\tbutton  padding ')).toBe('Fix the button padding');
});

describe('rewriteCommentStatus', () => {
	test('rewrites the status section in place', () => {
		const body =
			'<!-- luke-ui-visual-review -->\n## Visual review\n<!-- visual-review-status -->\n**Status:** Needs review\n<!-- /visual-review-status -->\n3 changed';
		expect(rewriteCommentStatus(body, 'Approved by @luke')).toBe(
			'<!-- luke-ui-visual-review -->\n## Visual review\n<!-- visual-review-status -->\n**Status:** Approved by @luke\n<!-- /visual-review-status -->\n3 changed',
		);
	});

	test('leaves a comment without a status section alone', () => {
		expect(rewriteCommentStatus('<!-- luke-ui-visual-review -->', 'Approved by @luke')).toBe(
			undefined,
		);
	});
});
