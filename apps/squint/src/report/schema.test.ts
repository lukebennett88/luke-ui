import { describe, expect, test } from 'vite-plus/test';
import { imageUrl, parseReport } from './schema.js';

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
