import { describe, expect, test } from 'vite-plus/test';
import type { Capture } from '../report/schema.js';
import { filterCaptures, parseReviewParams, stepCapture, stepZoom } from './review-params.js';

const captures: Array<Capture> = [
	{
		component: 'button',
		id: 'button/primary-paper-dark',
		name: 'primary-paper-dark',
		status: 'changed',
	},
	{
		component: 'button',
		id: 'button/primary-paper-light',
		name: 'primary-paper-light',
		status: 'added',
	},
	{
		component: 'radio-group',
		id: 'radio-group/states-paper-dark',
		name: 'states-paper-dark',
		status: 'removed',
	},
];

describe('parseReviewParams', () => {
	test('defaults to side by side, fitted, unfiltered, with outlines', () => {
		expect(parseReviewParams('?pr=12')).toEqual({
			capture: undefined,
			highlight: true,
			query: '',
			status: 'all',
			view: 'side',
			zoom: 'fit',
		});
	});

	test('reads a deep link', () => {
		const search =
			'?pr=12&capture=button%2Fprimary-paper-dark&view=overlay&zoom=2&q=dark&status=changed&highlight=off';

		expect(parseReviewParams(search)).toEqual({
			capture: 'button/primary-paper-dark',
			highlight: false,
			query: 'dark',
			status: 'changed',
			view: 'overlay',
			zoom: '2',
		});
	});

	test('falls back to the defaults for values it does not know', () => {
		expect(parseReviewParams('?view=sideways&zoom=3&status=flaky')).toMatchObject({
			status: 'all',
			view: 'side',
			zoom: 'fit',
		});
	});
});

describe('filterCaptures', () => {
	test('matches every term of the query against the capture id', () => {
		const ids = filterCaptures(captures, { query: 'paper  DARK', status: 'all' }).map(
			(capture) => capture.id,
		);

		expect(ids).toEqual(['button/primary-paper-dark', 'radio-group/states-paper-dark']);
	});

	test('narrows to one status', () => {
		const ids = filterCaptures(captures, { query: '', status: 'added' }).map(
			(capture) => capture.id,
		);

		expect(ids).toEqual(['button/primary-paper-light']);
	});
});

describe('stepCapture', () => {
	test('moves to the neighbouring capture', () => {
		expect(stepCapture(captures, 'button/primary-paper-dark', 1)?.id).toBe(
			'button/primary-paper-light',
		);
		expect(stepCapture(captures, 'button/primary-paper-light', -1)?.id).toBe(
			'button/primary-paper-dark',
		);
	});

	test('stops at either end of the list', () => {
		expect(stepCapture(captures, 'button/primary-paper-dark', -1)?.id).toBe(
			'button/primary-paper-dark',
		);
		expect(stepCapture(captures, 'radio-group/states-paper-dark', 1)?.id).toBe(
			'radio-group/states-paper-dark',
		);
	});

	test('starts from the first capture when the current one is filtered out', () => {
		expect(stepCapture(captures, 'text/body', 1)?.id).toBe('button/primary-paper-dark');
	});

	test('has nothing to select in an empty list', () => {
		expect(stepCapture([], undefined, 1)).toBeUndefined();
	});
});

describe('stepZoom', () => {
	test('steps from fit to actual size in either direction', () => {
		expect(stepZoom('fit', 1)).toBe('1');
		expect(stepZoom('fit', -1)).toBe('1');
	});

	test('steps through the fixed levels and stops at the smallest and largest', () => {
		expect(stepZoom('1', 1)).toBe('2');
		expect(stepZoom('1', -1)).toBe('0.5');
		expect(stepZoom('0.5', -1)).toBe('0.5');
		expect(stepZoom('4', 1)).toBe('4');
	});
});
