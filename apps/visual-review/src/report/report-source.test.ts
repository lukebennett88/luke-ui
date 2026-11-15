import { describe, expect, test } from 'vite-plus/test';
import { parseReportSource, pullRequestDataUrl } from './report-source.js';

describe('parseReportSource', () => {
	test('reads a pull request number', () => {
		expect(parseReportSource('?pr=1087&view=diff')).toEqual({ kind: 'pull-request', number: 1087 });
	});

	test('reads the local source', () => {
		expect(parseReportSource('?source=local')).toEqual({ kind: 'local' });
	});

	for (const search of ['', '?pr=', '?pr=0', '?pr=-1', '?pr=12abc', '?pr=1.5', '?source=remote']) {
		test(`names no report for "${search}"`, () => {
			expect(parseReportSource(search)).toBeUndefined();
		});
	}
});

test('pullRequestDataUrl fills the number into the template and drops a trailing slash', () => {
	expect(pullRequestDataUrl('https://pr-{pr}.example.pages.dev/', 12)).toBe(
		'https://pr-12.example.pages.dev',
	);
});
