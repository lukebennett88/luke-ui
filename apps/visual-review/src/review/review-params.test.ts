import { describe, expect, test } from 'vite-plus/test';
import type { Capture } from '../report/schema.js';
import { filterCaptures, parseReviewParams, reviewParamValues, stepZoom } from './review-params.js';

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
	test('defaults to the actual image, fitted, unfiltered, with outlines', () => {
		expect(parseReviewParams('?pr=12')).toEqual({
			capture: undefined,
			hideViewed: false,
			highlight: true,
			layout: 'single',
			pane: 'actual',
			query: '',
			status: 'all',
			zoom: 'fit',
		});
	});

	test('reads a deep link', () => {
		const search =
			'?pr=12&capture=button%2Fprimary-paper-dark&view=overlay&zoom=2&q=dark&status=changed&highlight=off&hide=viewed';

		expect(parseReviewParams(search)).toEqual({
			capture: 'button/primary-paper-dark',
			hideViewed: true,
			highlight: false,
			layout: 'overlay',
			pane: 'actual',
			query: 'dark',
			status: 'changed',
			zoom: '2',
		});
	});

	test('reads the image shown and the fit-screen zoom', () => {
		expect(parseReviewParams('?pane=expected&zoom=screen')).toMatchObject({
			layout: 'single',
			pane: 'expected',
			zoom: 'screen',
		});
	});

	test('opens a link from before the single-image layout on the same view', () => {
		expect(parseReviewParams('?view=diff')).toMatchObject({ layout: 'single', pane: 'diff' });
		expect(parseReviewParams('?view=side')).toMatchObject({ layout: 'side', pane: 'actual' });
	});

	test('falls back to the defaults for values it does not know', () => {
		expect(parseReviewParams('?view=sideways&pane=both&zoom=3&status=flaky')).toMatchObject({
			layout: 'single',
			pane: 'actual',
			status: 'all',
			zoom: 'fit',
		});
	});
});

describe('reviewParamValues', () => {
	test('leaves every default out of the link', () => {
		expect(reviewParamValues(parseReviewParams(''))).toEqual({
			hide: undefined,
			highlight: undefined,
			pane: undefined,
			q: undefined,
			status: undefined,
			view: undefined,
			zoom: undefined,
		});
	});

	test('writes back what it reads', () => {
		const search = '?hide=viewed&highlight=off&q=dark&status=added&view=side&zoom=4';
		const values = reviewParamValues(parseReviewParams(search));

		expect(values).toEqual({
			hide: 'viewed',
			highlight: 'off',
			pane: undefined,
			q: 'dark',
			status: 'added',
			view: 'side',
			zoom: '4',
		});
	});

	test('names the image only in the single layout', () => {
		expect(reviewParamValues(parseReviewParams('?pane=diff')).pane).toBe('diff');
		expect(reviewParamValues(parseReviewParams('?pane=diff&view=overlay')).pane).toBeUndefined();
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

describe('stepZoom', () => {
	test('zooms in from a fit to actual size, and never zooms in when zooming out', () => {
		expect(stepZoom('fit', 1)).toBe('1');
		expect(stepZoom('fit', -1)).toBe('fit');
		expect(stepZoom('screen', 1)).toBe('1');
		expect(stepZoom('screen', -1)).toBe('screen');
	});

	test('steps through the fixed levels and stops at the smallest and largest', () => {
		expect(stepZoom('1', 1)).toBe('2');
		expect(stepZoom('1', -1)).toBe('0.5');
		expect(stepZoom('0.5', -1)).toBe('0.5');
		expect(stepZoom('4', 1)).toBe('4');
	});
});
