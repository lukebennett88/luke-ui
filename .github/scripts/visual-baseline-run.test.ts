import { tmpdir } from 'node:os';
import path from 'node:path';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';
import { countPngs } from './count-pngs.js';
import {
	countRequiringReview,
	countsTableRows,
	decideBaselineRun,
	isWorkflowMissingStatus,
} from './visual-baseline-run.js';
import type { VisualCounts } from './visual-summary-types.js';

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
		{ conclusion: 'success', id: 42, status: 'completed' },
		runUrl,
	);
	expect(decision).toEqual({ ok: true, runId: 42 });
});

test('reports the bootstrap case when no run exists', () => {
	const decision = decideBaselineRun(undefined, runUrl);
	expect(decision.ok).toBe(false);
	expect(decision.ok === false && decision.reason).toContain('After this PR merges');
});

test('rejects a newest run that is still in progress rather than using an older one', () => {
	const decision = decideBaselineRun({ conclusion: null, id: 7, status: 'in_progress' }, runUrl);
	expect(decision.ok).toBe(false);
	expect(decision.ok === false && decision.reason).toContain('in_progress');
	// The failing run's own URL, never an older green run's.
	expect(decision.ok === false && decision.reason).toContain(runUrl(7));
});

test('rejects a newest run that failed rather than falling back to an older success', () => {
	const decision = decideBaselineRun({ conclusion: 'failure', id: 9, status: 'completed' }, runUrl);
	expect(decision.ok).toBe(false);
	expect(decision.ok === false && decision.reason).toContain('failure');
	expect(decision.ok === false && decision.reason).toContain(runUrl(9));
});

test('rejects a cancelled newest run', () => {
	const decision = decideBaselineRun(
		{ conclusion: 'cancelled', id: 11, status: 'completed' },
		runUrl,
	);
	expect(decision.ok).toBe(false);
	expect(decision.ok === false && decision.reason).toContain('cancelled');
});

test('checks status before conclusion so a queued run is not read as a failure', () => {
	const decision = decideBaselineRun({ conclusion: null, id: 3, status: 'queued' }, runUrl);
	expect(decision.ok === false && decision.reason).toContain('queued');
});

test('treats only 404 as the missing-workflow bootstrap case', () => {
	expect(isWorkflowMissingStatus(404)).toBe(true);
	expect(isWorkflowMissingStatus(403)).toBe(false);
	expect(isWorkflowMissingStatus(500)).toBe(false);
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
