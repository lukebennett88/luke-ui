import { describe, expect, test } from 'vite-plus/test';
import type { Capture } from './schema.js';
import { imageSize, imageUrl, parseReport } from './schema.js';

const counts = { added: 1, changed: 1, removed: 0, unchanged: 1 };

describe('parseReport', () => {
	test('keeps differing captures, sorted by id, and drops unchanged ones', () => {
		const report = parseReport({
			counts,
			results: [
				{ id: 'text/body', status: 'unchanged' },
				{ id: 'text/added', status: 'added' },
				{
					height: 24,
					id: 'button/primary-paper-dark',
					mismatchedPixels: 76,
					status: 'changed',
					width: 1024,
				},
			],
		});

		expect(report.captures).toEqual([
			{
				component: 'button',
				height: 24,
				id: 'button/primary-paper-dark',
				mismatchedPixels: 76,
				name: 'primary-paper-dark',
				status: 'changed',
				width: 1024,
			},
			{ component: 'text', id: 'text/added', name: 'added', status: 'added' },
		]);
		expect(report.counts).toEqual(counts);
	});

	test('drops the local file paths a comparison writes beside each result', () => {
		const report = parseReport({
			counts,
			results: [{ actual: '/work/diff/text/added.actual.png', id: 'text/added', status: 'added' }],
		});

		expect(report.captures[0]).not.toHaveProperty('actual');
	});

	test('keeps the fingerprint a published report writes, and rejects one it could not have', () => {
		const fingerprint = 'c'.repeat(64);

		expect(
			parseReport({ counts, results: [{ fingerprint, id: 'text/added', status: 'added' }] })
				.captures[0]?.fingerprint,
		).toBe(fingerprint);
		expect(() =>
			parseReport({
				counts,
				results: [{ fingerprint: '<script>', id: 'text/added', status: 'added' }],
			}),
		).toThrow('Invalid string');
	});

	test('keeps the commit a published report was rendered from', () => {
		const meta = {
			generatedAt: '2026-11-16T00:00:00.000Z',
			headSha: 'a'.repeat(40),
			pullRequest: 12,
			runAttempt: 1,
			runId: 34,
		};

		expect(parseReport({ counts, meta, results: [] }).meta).toEqual(meta);
	});

	for (const id of ['../secrets', 'button', 'button/Primary', 'https://example.com/a', 'a/b/c']) {
		test(`rejects the capture id ${id}`, () => {
			expect(() => parseReport({ counts, results: [{ id, status: 'changed' }] })).toThrow(
				'Invalid string',
			);
		});
	}

	test('rejects an unknown status', () => {
		expect(() => parseReport({ counts, results: [{ id: 'text/body', status: 'flaky' }] })).toThrow(
			'Invalid option',
		);
	});
});

test('imageUrl addresses an image beside the report', () => {
	expect(imageUrl('https://pr-12.example.pages.dev', 'button/primary', 'diff')).toBe(
		'https://pr-12.example.pages.dev/diff/button/primary.diff.png',
	);
});

describe('imageSize', () => {
	const capture: Capture = {
		component: 'button',
		height: 300,
		id: 'button/primary',
		mismatchedPixels: 260,
		name: 'primary',
		status: 'changed',
		width: 200,
	};

	test('gives every image the report’s size when the expected and actual sizes match', () => {
		for (const kind of ['expected', 'actual', 'diff'] as const) {
			expect(imageSize(capture, kind)).toEqual({ height: 300, width: 200 });
		}
	});

	test('gives only the diff a size when every pixel differs, as a size change makes them', () => {
		const resized = { ...capture, mismatchedPixels: 200 * 300 };
		expect(imageSize(resized, 'diff')).toEqual({ height: 300, width: 200 });
		expect(imageSize(resized, 'expected')).toBeUndefined();
		expect(imageSize(resized, 'actual')).toBeUndefined();
	});

	test('gives no size when the report has none', () => {
		const added: Capture = { component: 'text', id: 'text/added', name: 'added', status: 'added' };
		expect(imageSize(added, 'actual')).toBeUndefined();
	});
});
