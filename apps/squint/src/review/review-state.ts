import type { Example } from './examples.js';
import type { ReviewParams } from './review-params.js';
import type { CapturePosition } from './scroll-position.js';
import type { SeenEntries } from './seen-store.js';
import type { CaptureView } from './stage.js';

/**
 * What a review holds that the link does not: where the reviewer is, how each example and capture is
 * shown, the open overlays, the offer to undo, and what was last announced. Viewed state lives in
 * the seen store, and filters and the image shown live in the query string.
 */
export type ReviewState = {
	/** Each example's chosen theme, by example id. Others show their first theme still to view. */
	activeTheme: Readonly<Record<string, string>>;
	announcement: string;
	/** The example the top bar acts on, as last scrolled to or chosen. */
	current: string | undefined;
	/** The Review decisions dialog, or the list of keyboard shortcuts. */
	dialog: ReviewDialog | undefined;
	/** Examples opened or folded by hand. The rest stay open until every theme is viewed. */
	expanded: Readonly<Record<string, boolean>>;
	isContentsOpen: boolean;
	/**
	 * Where the page should move once the render that shows it commits. Each request has its own
	 * `seq`, so asking again for the same place still moves the page there.
	 */
	reveal: { seq: number; target: RevealTarget } | undefined;
	/** The offer to undo the last mark, and whether the pointer or focus holds it in place. */
	undo: { isHeld: boolean; offer: UndoOffer } | undefined;
	/** Each capture's zoom and selected difference, by capture id. */
	views: Readonly<Record<string, CaptureView>>;
};

export type ReviewDialog = 'review' | 'shortcuts';

export type RevealTarget =
	/**
	 * Scrolls the example's header below the top bar, or back to where `restore` says it was, and
	 * can focus its toggle.
	 */
	| {
			exampleId: string;
			/** Jumps instead of scrolling smoothly, for the deep link a page opens on. */
			isInstant?: boolean;
			kind: 'example';
			restore?: CapturePosition | undefined;
			shouldFocus: boolean;
			shouldScroll: boolean;
	  }
	/** Centres the example's active difference on screen, once its outline renders. */
	| { exampleId: string; kind: 'difference' };

type UndoOffer = {
	captureId: string;
	label: string;
	/** What each marked capture had stored before, so Undo puts back a `changed` state too. */
	previous: SeenEntries;
	/** Where the section was, when it was on screen. */
	position: CapturePosition | undefined;
	exampleId: string;
};

export type ReviewAction =
	/** The example becomes the one in view, with no change to how it is shown. */
	| { exampleId: string; type: 'wentTo' }
	/** The example opens and comes into view, on `captureId`'s theme when one is given. */
	| { captureId?: string; exampleId: string; type: 'opened' }
	| { exampleId: string; type: 'folded' }
	| { captureId: string; exampleId: string; type: 'themeSelected' }
	| { captureId: string; exampleId: string; patch: Partial<CaptureView>; type: 'viewChanged' }
	/**
	 * A theme is viewed. The example moves on to `nextCaptureId`, still to view, or folds when there
	 * is none.
	 */
	| {
			exampleId: string;
			nextCaptureId: string | undefined;
			offer: UndoOffer;
			type: 'markedViewed';
	  }
	/** Unmarking undoes by hand, so an offer to undo an earlier mark is out of date. */
	| { exampleId: string; type: 'unviewed' }
	| { type: 'undone' }
	| { type: 'undoDismissed' }
	| { isHeld: boolean; type: 'undoHeldChanged' }
	| { isOpen: boolean; type: 'contentsOpenChanged' }
	| { dialog: ReviewDialog; isOpen: boolean; type: 'dialogOpenChanged' }
	| { target: RevealTarget; type: 'revealRequested' }
	/** The page moved for the request numbered `seq`. */
	| { seq: number; type: 'revealed' }
	| { message: string; type: 'announced' };

export const DEFAULT_VIEW: CaptureView = {
	activeRegion: undefined,
	highlight: true,
	layout: 'single',
	split: 50,
	zoom: 'fit',
};

/**
 * A deep link to a capture opens on its example, theme, and zoom. Contents starts open beside a
 * report of several examples, where it is the index; a drawer waits to be asked for.
 */
export function initialReviewState({
	captureId,
	examples,
	isContentsOpen,
	view,
}: {
	captureId: string | undefined;
	examples: ReadonlyArray<Example>;
	isContentsOpen: boolean;
	view: Pick<ReviewParams, 'highlight' | 'layout' | 'split' | 'zoom'>;
}): ReviewState {
	const state: ReviewState = {
		activeTheme: {},
		announcement: '',
		current: undefined,
		dialog: undefined,
		expanded: {},
		isContentsOpen,
		reveal: undefined,
		undo: undefined,
		views: {},
	};
	const example = examples.find((candidate) =>
		candidate.captures.some((capture) => capture.id === captureId),
	);
	if (!captureId || !example) return state;
	return {
		...open(state, example.id, captureId),
		// The deep link's section scrolls into view once the sections have laid out.
		reveal: {
			seq: 1,
			target: {
				exampleId: example.id,
				isInstant: true,
				kind: 'example',
				shouldFocus: false,
				shouldScroll: true,
			},
		},
		views: { [captureId]: { ...view, activeRegion: undefined } },
	};
}

export function reviewReducer(state: ReviewState, action: ReviewAction): ReviewState {
	switch (action.type) {
		case 'wentTo':
			if (state.current === action.exampleId) return state;
			return { ...state, current: action.exampleId };
		case 'opened':
			return open(state, action.exampleId, action.captureId);
		case 'folded':
			return { ...state, expanded: { ...state.expanded, [action.exampleId]: false } };
		case 'themeSelected':
			return {
				...state,
				activeTheme: { ...state.activeTheme, [action.exampleId]: action.captureId },
				current: action.exampleId,
			};
		case 'viewChanged':
			return {
				...state,
				current: action.exampleId,
				views: {
					...state.views,
					[action.captureId]: {
						...(state.views[action.captureId] ?? DEFAULT_VIEW),
						...action.patch,
					},
				},
			};
		case 'markedViewed': {
			const { exampleId, nextCaptureId, offer } = action;
			// A new offer replaces the last. The toast stays in place, so a hold on it carries over.
			const marked = {
				...state,
				current: exampleId,
				undo: { isHeld: state.undo?.isHeld ?? false, offer },
			};
			if (nextCaptureId) {
				return { ...marked, activeTheme: { ...state.activeTheme, [exampleId]: nextCaptureId } };
			}
			return { ...marked, expanded: { ...state.expanded, [exampleId]: false } };
		}
		case 'unviewed':
			return {
				...state,
				expanded: { ...state.expanded, [action.exampleId]: true },
				undo: undefined,
			};
		case 'undone': {
			if (!state.undo) return state;
			const { captureId, exampleId } = state.undo.offer;
			return open({ ...state, undo: undefined }, exampleId, captureId);
		}
		case 'undoDismissed':
			return { ...state, undo: undefined };
		case 'undoHeldChanged':
			if (!state.undo || state.undo.isHeld === action.isHeld) return state;
			return { ...state, undo: { ...state.undo, isHeld: action.isHeld } };
		case 'contentsOpenChanged':
			return { ...state, isContentsOpen: action.isOpen };
		case 'dialogOpenChanged':
			if (action.isOpen) return { ...state, dialog: action.dialog };
			// A dialog closing after another opened in its place leaves the new one open.
			return state.dialog === action.dialog ? { ...state, dialog: undefined } : state;
		case 'revealRequested':
			return { ...state, reveal: { seq: (state.reveal?.seq ?? 0) + 1, target: action.target } };
		case 'revealed':
			return state.reveal?.seq === action.seq ? { ...state, reveal: undefined } : state;
		case 'announced':
			return { ...state, announcement: action.message };
	}
}

function open(state: ReviewState, exampleId: string, captureId: string | undefined): ReviewState {
	return {
		...state,
		activeTheme: captureId ? { ...state.activeTheme, [exampleId]: captureId } : state.activeTheme,
		current: exampleId,
		expanded: { ...state.expanded, [exampleId]: true },
	};
}
