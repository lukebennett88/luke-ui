import { describe, expect, test } from 'vite-plus/test';
import { parseReportSource, reportBaseUrl } from './report-source.js';

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

describe('reportBaseUrl', () => {
	test('fills the pull request number into the data URL template', () => {
		const url = reportBaseUrl(
			{ kind: 'pull-request', number: 12 },
			'https://pr-{pr}.example.pages.dev/',
		);

		expect(url).toBe('https://pr-12.example.pages.dev');
	});

	test('has no pull request URL without a template', () => {
		expect(reportBaseUrl({ kind: 'pull-request', number: 12 }, undefined)).toBeUndefined();
	});
});
