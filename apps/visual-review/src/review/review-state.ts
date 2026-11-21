import type { Example } from './examples.js';
import type { Zoom } from './review-params.js';
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
	/** The View options or the Review decisions. Opening one closes the other. */
	dialog: ReviewDialog | undefined;
	/** Examples opened or folded by hand. The rest stay open until every theme is viewed. */
	expanded: Readonly<Record<string, boolean>>;
	isContentsOpen: boolean;
	/** The overlay layout's opacity, as a percentage. */
	opacity: number;
	/** The offer to undo the last mark, and whether the pointer or focus holds it in place. */
	undo: { isHeld: boolean; offer: UndoOffer } | undefined;
	/** Each capture's zoom and selected difference, by capture id. */
	views: Readonly<Record<string, CaptureView>>;
};

export type ReviewDialog = 'review' | 'view';

export type UndoOffer = {
	captureIds: ReadonlyArray<string>;
	exampleId: string | undefined;
	/** Whether the mark folded the example, so Undo scrolls back to open it. */
	isFolded: boolean;
	/** A report-wide mark keeps its offer until the next mark or until it is dismissed. */
	isPersistent: boolean;
	label: string;
	/** What each marked capture had stored before, so Undo puts back a `changed` state too. */
	previous: SeenEntries;
};

export type ReviewAction =
	/** The example becomes the one in view, with no change to how it is shown. */
	| { exampleId: string; type: 'wentTo' }
	/** The example opens and comes into view, on `captureId`'s theme when one is given. */
	| { captureId?: string; exampleId: string; type: 'opened' }
	| { exampleId: string; type: 'folded' }
	| { captureId: string; exampleId: string; type: 'themeSelected' }
	| { captureId: string; exampleId: string; patch: Partial<CaptureView>; type: 'viewChanged' }
	/** A theme is viewed, and the example moves on to `nextCaptureId`, still to view. */
	| { exampleId: string; nextCaptureId: string; offer: UndoOffer; type: 'themeViewed' }
	/** Every theme of the example is viewed, so it folds. No offer when nothing new was marked. */
	| { exampleId: string; offer: UndoOffer | undefined; type: 'exampleViewed' }
	| { offer: UndoOffer | undefined; type: 'reportViewed' }
	/** Unmarking undoes by hand, so an offer to undo an earlier mark is out of date. */
	| { exampleId: string; type: 'unviewed' }
	| { type: 'undone' }
	| { type: 'undoDismissed' }
	| { isHeld: boolean; type: 'undoHeldChanged' }
	| { isOpen: boolean; type: 'contentsOpenChanged' }
	| { dialog: ReviewDialog; isOpen: boolean; type: 'dialogOpenChanged' }
	| { opacity: number; type: 'opacityChanged' }
	| { message: string; type: 'announced' };

export const DEFAULT_VIEW: CaptureView = { activeRegion: undefined, zoom: 'fit' };

/** A deep link to a capture opens on its example, theme, and zoom. */
export function initialReviewState({
	captureId,
	examples,
	zoom,
}: {
	captureId: string | undefined;
	examples: ReadonlyArray<Example>;
	zoom: Zoom;
}): ReviewState {
	const state: ReviewState = {
		activeTheme: {},
		announcement: '',
		current: undefined,
		dialog: undefined,
		expanded: {},
		isContentsOpen: false,
		opacity: 50,
		undo: undefined,
		views: {},
	};
	const example = examples.find((candidate) =>
		candidate.captures.some((capture) => capture.id === captureId),
	);
	if (!captureId || !example) return state;
	return {
		...open(state, example.id, captureId),
		views: { [captureId]: { activeRegion: undefined, zoom } },
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
		case 'themeViewed':
			return {
				...offerUndo(state, action.offer),
				activeTheme: { ...state.activeTheme, [action.exampleId]: action.nextCaptureId },
			};
		case 'exampleViewed': {
			// Forgetting the example's open state lets it fold now that it is viewed.
			const { [action.exampleId]: _, ...expanded } = state.expanded;
			return { ...offerUndo(state, action.offer), expanded };
		}
		case 'reportViewed':
			return { ...offerUndo(state, action.offer), expanded: {} };
		case 'unviewed':
			return {
				...state,
				expanded: { ...state.expanded, [action.exampleId]: true },
				undo: undefined,
			};
		case 'undone': {
			if (!state.undo) return state;
			const { captureIds, exampleId } = state.undo.offer;
			const next = { ...state, undo: undefined };
			return exampleId ? open(next, exampleId, captureIds[0]) : next;
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
		case 'opacityChanged':
			return { ...state, opacity: action.opacity };
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

/** A new offer replaces the last. The toast stays in place, so a hold on it carries over. */
function offerUndo(state: ReviewState, offer: UndoOffer | undefined): ReviewState {
	if (!offer) return state;
	return { ...state, undo: { isHeld: state.undo?.isHeld ?? false, offer } };
}
