import { describe, expect, test } from 'vite-plus/test';
import type { Capture } from '../report/schema.js';
import { groupExamples } from './examples.js';
import type { ReviewState, UndoOffer } from './review-state.js';
import { initialReviewState, reviewReducer } from './review-state.js';

function capture(id: string): Capture {
	const [component = '', name = ''] = id.split('/');
	return { component, id, name, status: 'changed' };
}

const examples = groupExamples([
	capture('button/primary-paper-light'),
	capture('button/primary-paper-dark'),
	capture('button/secondary-paper-light'),
]);

const fresh = initialReviewState({ captureId: undefined, examples, zoom: 'fit' });

function offer(overrides: Partial<UndoOffer> = {}): UndoOffer {
	return {
		captureIds: ['button/primary-paper-dark'],
		exampleId: 'button/primary',
		isFolded: true,
		isPersistent: false,
		label: 'primary viewed',
		previous: {},
		...overrides,
	};
}

function withOffer(state: ReviewState, isHeld = false): ReviewState {
	return { ...state, undo: { isHeld, offer: offer() } };
}

describe('initialReviewState', () => {
	test('opens a deep-linked capture on its example, theme, and zoom', () => {
		const state = initialReviewState({
			captureId: 'button/primary-paper-dark',
			examples,
			zoom: '2',
		});

		expect(state).toMatchObject({
			activeTheme: { 'button/primary': 'button/primary-paper-dark' },
			current: 'button/primary',
			expanded: { 'button/primary': true },
			views: { 'button/primary-paper-dark': { activeRegion: undefined, zoom: '2' } },
		});
	});

	test('ignores a link to a capture the report does not have', () => {
		const state = initialReviewState({ captureId: 'button/missing', examples, zoom: '2' });

		expect(state).toEqual(fresh);
	});
});

describe('reviewReducer', () => {
	test('folding a viewed example forgets that it was opened by hand', () => {
		const opened = reviewReducer(fresh, { exampleId: 'button/primary', type: 'opened' });
		const state = reviewReducer(opened, {
			exampleId: 'button/primary',
			offer: offer(),
			type: 'exampleViewed',
		});

		expect(state.expanded).toEqual({});
		expect(state.undo).toEqual({ isHeld: false, offer: offer() });
	});

	test('a mark that marks nothing new keeps the earlier offer', () => {
		const state = reviewReducer(withOffer(fresh), {
			exampleId: 'button/secondary',
			offer: undefined,
			type: 'exampleViewed',
		});

		expect(state.undo?.offer).toEqual(offer());
	});

	test('a new offer keeps a hold on the toast', () => {
		const state = reviewReducer(withOffer(fresh, true), {
			exampleId: 'button/primary',
			nextCaptureId: 'button/primary-paper-dark',
			offer: offer({ label: 'primary, Paper light viewed' }),
			type: 'themeViewed',
		});

		expect(state.undo).toEqual({
			isHeld: true,
			offer: offer({ label: 'primary, Paper light viewed' }),
		});
		expect(state.activeTheme).toEqual({ 'button/primary': 'button/primary-paper-dark' });
	});

	test('unmarking withdraws the offer and its hold, and opens the example', () => {
		const state = reviewReducer(withOffer(fresh, true), {
			exampleId: 'button/primary',
			type: 'unviewed',
		});

		expect(state.undo).toBeUndefined();
		expect(state.expanded).toEqual({ 'button/primary': true });
	});

	test('undoing reopens the example on the first theme it marked', () => {
		const state = reviewReducer(withOffer(fresh, true), { type: 'undone' });

		expect(state).toMatchObject({
			activeTheme: { 'button/primary': 'button/primary-paper-dark' },
			current: 'button/primary',
			expanded: { 'button/primary': true },
			undo: undefined,
		});
	});

	test('undoing a report-wide mark changes nothing but the offer', () => {
		const marked = { ...fresh, undo: { isHeld: false, offer: offer({ exampleId: undefined }) } };

		expect(reviewReducer(marked, { type: 'undone' })).toEqual(fresh);
	});

	test('a dialog that closes after another opened in its place leaves the new one open', () => {
		const view = reviewReducer(fresh, { dialog: 'view', isOpen: true, type: 'dialogOpenChanged' });
		const review = reviewReducer(view, {
			dialog: 'review',
			isOpen: true,
			type: 'dialogOpenChanged',
		});
		const state = reviewReducer(review, {
			dialog: 'view',
			isOpen: false,
			type: 'dialogOpenChanged',
		});

		expect(state.dialog).toBe('review');
	});

	test('changing a view keeps the rest of it and makes its example current', () => {
		const zoomed = reviewReducer(fresh, {
			captureId: 'button/secondary-paper-light',
			exampleId: 'button/secondary',
			patch: { zoom: '2' },
			type: 'viewChanged',
		});
		const state = reviewReducer(zoomed, {
			captureId: 'button/secondary-paper-light',
			exampleId: 'button/secondary',
			patch: { activeRegion: 1 },
			type: 'viewChanged',
		});

		expect(state.current).toBe('button/secondary');
		expect(state.views).toEqual({ 'button/secondary-paper-light': { activeRegion: 1, zoom: '2' } });
	});
});
