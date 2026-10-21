import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';
import type { BaselineRun, VisualCounts } from './visual-ci.js';
import {
	countPngs,
	hasRequiredVisualReviewers,
	countRequiringReview,
	countsTableRows,
	decideBaselineRun,
	isBaselineRunWaitable,
	isWorkflowMissingStatus,
	waitForNewestBaseline,
} from './visual-ci.js';

const runUrl = (runId: number) => `https://github.com/o/r/actions/runs/${runId}`;

const counts = (overrides: Partial<VisualCounts> = {}): VisualCounts => ({
	added: 0,
	changed: 0,
	removed: 0,
	unchanged: 0,
	...overrides,
});

test('accepts the newest run when it completed successfully', () => {
	const decision = decideBaselineRun(
		{ conclusion: 'success', id: 42, run_attempt: 2, status: 'completed' },
		runUrl,
	);
	expect(decision).toEqual({ ok: true, runAttempt: 2, runId: 42 });
});

test('reports the bootstrap case when no run exists', () => {
	const decision = decideBaselineRun(undefined, runUrl);
	expect(decision.ok).toBe(false);
	expect(!decision.ok && decision.reason).toContain('After this PR merges');
});

test('rejects a newest run that is still in progress rather than using an older one', () => {
	const decision = decideBaselineRun({ conclusion: null, id: 7, status: 'in_progress' }, runUrl);
	expect(decision.ok).toBe(false);
	expect(!decision.ok && decision.reason).toContain('in_progress');
	// The failing run's own URL, never an older green run's.
	expect(!decision.ok && decision.reason).toContain(runUrl(7));
});

test('rejects a newest run that failed rather than falling back to an older success', () => {
	const decision = decideBaselineRun({ conclusion: 'failure', id: 9, status: 'completed' }, runUrl);
	expect(decision.ok).toBe(false);
	expect(!decision.ok && decision.reason).toContain('failure');
	expect(!decision.ok && decision.reason).toContain(runUrl(9));
});

test('rejects a cancelled newest run', () => {
	const decision = decideBaselineRun(
		{ conclusion: 'cancelled', id: 11, status: 'completed' },
		runUrl,
	);
	expect(decision.ok).toBe(false);
	expect(!decision.ok && decision.reason).toContain('cancelled');
});

test('checks status before conclusion so a queued run is not read as a failure', () => {
	const decision = decideBaselineRun({ conclusion: null, id: 3, status: 'queued' }, runUrl);
	expect(!decision.ok && decision.reason).toContain('queued');
});

test('treats only 404 as the missing-workflow bootstrap case', () => {
	expect(isWorkflowMissingStatus(404)).toBe(true);
	expect(isWorkflowMissingStatus(403)).toBe(false);
	expect(isWorkflowMissingStatus(500)).toBe(false);
});

test('marks queued and in-progress baseline statuses as waitable', () => {
	expect(isBaselineRunWaitable('queued')).toBe(true);
	expect(isBaselineRunWaitable('in_progress')).toBe(true);
	expect(isBaselineRunWaitable('pending')).toBe(true);
	expect(isBaselineRunWaitable('waiting')).toBe(true);
	expect(isBaselineRunWaitable('requested')).toBe(true);
	expect(isBaselineRunWaitable('completed')).toBe(false);
	expect(isBaselineRunWaitable(null)).toBe(false);
});

test('counts every status that needs review and excludes unchanged', () => {
	expect(countRequiringReview(counts({ added: 2, changed: 3, removed: 1, unchanged: 100 }))).toBe(
		6,
	);
});

test('reports zero to review when everything is unchanged', () => {
	expect(countRequiringReview(counts({ unchanged: 154 }))).toBe(0);
});

test('renders the counts table with the review-worthy statuses first', () => {
	expect(countsTableRows(counts({ added: 1, changed: 2, removed: 3, unchanged: 4 }))).toEqual([
		['changed', '2'],
		['added', '1'],
		['removed', '3'],
		['unchanged', '4'],
	]);
});

test('counts PNGs recursively and ignores other files', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-count-'));
	await mkdir(path.join(root, 'nested'), { recursive: true });
	await writeFile(path.join(root, 'a.png'), '');
	await writeFile(path.join(root, 'nested', 'b.png'), '');
	await writeFile(path.join(root, 'summary.json'), '{}');

	expect(await countPngs(root)).toBe(2);
});

test('reports zero PNGs for an empty or missing directory', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-count-empty-'));
	expect(await countPngs(root)).toBe(0);
	expect(await countPngs(path.join(root, 'does-not-exist'))).toBe(0);
});

function createClock() {
	let nowMs = 0;
	const sleepCalls: Array<number> = [];

	return {
		now: () => nowMs,
		async sleep(ms: number) {
			sleepCalls.push(ms);
			nowMs += ms;
		},
		sleepCalls,
	};
}

function sequenceFetch(responses: Array<BaselineRun | undefined | 'workflow-missing'>) {
	const remaining = [...responses];
	return async () => {
		const next = remaining.shift();
		if (next === undefined && remaining.length === 0) {
			throw new Error('fetchNewest called more times than stubbed responses');
		}
		return next;
	};
}

test('waits through in-progress polls then accepts the same newest run once it succeeds', async () => {
	const clock = createClock();
	const logs: Array<string> = [];
	const runId = await waitForNewestBaseline({
		fetchNewest: sequenceFetch([
			{ conclusion: null, id: 70, status: 'queued' },
			{ conclusion: null, id: 70, status: 'in_progress' },
			{ conclusion: 'success', id: 70, status: 'completed' },
		]),
		runUrl,
		sleep: (ms) => clock.sleep(ms),
		now: () => clock.now(),
		pollIntervalMs: 1_000,
		timeoutMs: 10_000,
		info: (message) => logs.push(message),
	});

	expect(runId).toBe(70);
	expect(clock.sleepCalls).toEqual([1_000, 1_000]);
	expect(logs.some((line) => line.includes('queued') && line.includes(runUrl(70)))).toBe(true);
	expect(logs.some((line) => line.includes('completed successfully'))).toBe(true);
});

test('times out while the newest baseline stays in progress without falling back', async () => {
	const clock = createClock();

	await expect(
		waitForNewestBaseline({
			fetchNewest: async () => ({ conclusion: null, id: 88, status: 'in_progress' }),
			runUrl,
			sleep: (ms) => clock.sleep(ms),
			now: () => clock.now(),
			pollIntervalMs: 5_000,
			timeoutMs: 12_000,
		}),
	).rejects.toThrow(/Timed out after .*88/);

	expect(clock.sleepCalls).toEqual([5_000, 5_000, 2_000]);
});

test('fails once the waited-for newest baseline concludes unsuccessfully', async () => {
	const clock = createClock();

	await expect(
		waitForNewestBaseline({
			fetchNewest: sequenceFetch([
				{ conclusion: null, id: 91, status: 'in_progress' },
				{ conclusion: 'failure', id: 91, status: 'completed' },
			]),
			runUrl,
			sleep: (ms) => clock.sleep(ms),
			now: () => clock.now(),
			pollIntervalMs: 500,
			timeoutMs: 5_000,
		}),
	).rejects.toThrow(/concluded failure/);
});

test('fails immediately when the newest completed baseline was cancelled', async () => {
	await expect(
		waitForNewestBaseline({
			fetchNewest: async () => ({ conclusion: 'cancelled', id: 12, status: 'completed' }),
			runUrl,
			sleep: async () => {
				throw new Error('sleep should not run');
			},
			now: () => 0,
			pollIntervalMs: 1_000,
			timeoutMs: 5_000,
		}),
	).rejects.toThrow(/cancelled/);
});

test('returns immediately when the newest baseline is already successful', async () => {
	const clock = createClock();
	const runId = await waitForNewestBaseline({
		fetchNewest: async () => ({ conclusion: 'success', id: 5, status: 'completed' }),
		runUrl,
		sleep: (ms) => clock.sleep(ms),
		now: () => clock.now(),
		pollIntervalMs: 1_000,
		timeoutMs: 5_000,
	});

	expect(runId).toBe(5);
	expect(clock.sleepCalls).toEqual([]);
});

test('switches to a newer in-progress run that appears while waiting, even when status matches', async () => {
	const clock = createClock();
	const logs: Array<string> = [];
	const runId = await waitForNewestBaseline({
		fetchNewest: sequenceFetch([
			{ conclusion: null, id: 10, status: 'in_progress' },
			{ conclusion: null, id: 20, status: 'in_progress' },
			{ conclusion: 'success', id: 20, status: 'completed' },
		]),
		runUrl,
		sleep: (ms) => clock.sleep(ms),
		now: () => clock.now(),
		pollIntervalMs: 1_000,
		timeoutMs: 10_000,
		info: (message) => logs.push(message),
	});

	expect(runId).toBe(20);
	expect(
		logs.some((line) => line.includes('changed from 10 to 20') && line.includes(runUrl(20))),
	).toBe(true);
	expect(logs.some((line) => line.includes('completed successfully') && line.includes('20'))).toBe(
		true,
	);
});

test('keeps the original timeout bound when a newer waitable run appears mid-wait', async () => {
	const clock = createClock();
	const logs: Array<string> = [];
	let calls = 0;

	await expect(
		waitForNewestBaseline({
			fetchNewest: async () => {
				calls += 1;
				if (calls === 1) {
					return { conclusion: null, id: 10, status: 'in_progress' };
				}
				return { conclusion: null, id: 20, status: 'in_progress' };
			},
			runUrl,
			sleep: (ms) => clock.sleep(ms),
			now: () => clock.now(),
			pollIntervalMs: 5_000,
			timeoutMs: 12_000,
			info: (message) => logs.push(message),
		}),
	).rejects.toThrow(/Timed out after .*20/);

	expect(logs.some((line) => line.includes('changed from 10 to 20'))).toBe(true);
	expect(clock.sleepCalls).toEqual([5_000, 5_000, 2_000]);
});

function visualGatePasses(options: { compare: string; review: string; changes: string }): boolean {
	try {
		execFileSync('bash', [fileURLToPath(new URL('./visual-gate.sh', import.meta.url))], {
			env: {
				...process.env,
				COMPARE: options.compare,
				REVIEW: options.review,
				CHANGES: options.changes,
			},
			stdio: 'pipe',
		});
		return true;
	} catch {
		return false;
	}
}

const completedGate = {
	compare: 'success',
	review: 'skipped',
	changes: '0',
};
test('an identical completed comparison passes the gate without review', () => {
	expect(visualGatePasses(completedGate)).toBe(true);
	expect(visualGatePasses({ ...completedGate, changes: '2', review: 'success' })).toBe(true);
});

for (const failure of [
	{ compare: 'failure' },
	{ compare: 'skipped' },
	{ compare: 'cancelled' },
	{ changes: '' },
	{ changes: '2', review: 'skipped' },
	{ changes: '2', review: 'failure' },
]) {
	test(`rejects incomplete gate prerequisites ${JSON.stringify(failure)}`, () => {
		expect(visualGatePasses({ ...completedGate, ...failure })).toBe(false);
	});
}

test('visual review requires configured human reviewers', () => {
	expect(hasRequiredVisualReviewers({})).toBe(false);
	expect(hasRequiredVisualReviewers({ protection_rules: [] })).toBe(false);
	expect(hasRequiredVisualReviewers({ protection_rules: [{ type: 'wait_timer' }] })).toBe(false);
	expect(
		hasRequiredVisualReviewers({
			protection_rules: [{ type: 'required_reviewers', reviewers: [] }],
		}),
	).toBe(false);
	expect(
		hasRequiredVisualReviewers({
			protection_rules: [{ type: 'required_reviewers', reviewers: [{ id: 1 }] }],
		}),
	).toBe(true);
});
