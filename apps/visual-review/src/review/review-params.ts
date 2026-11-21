import type { Capture, CaptureStatus } from '../report/schema.js';

/** One image at a time, or both images side by side, or the actual image over the expected one. */
export const LAYOUTS = ['single', 'side', 'overlay'] as const;
export type Layout = (typeof LAYOUTS)[number];

/** The image the single layout shows. */
export const PANES = ['expected', 'actual', 'diff'] as const;
export type Pane = (typeof PANES)[number];

/**
 * `fit` fits an image to the available width without scaling it up. `screen` fits the whole image
 * on screen. A number is a fixed scale.
 */
const ZOOM_LEVELS = ['fit', 'screen', '0.5', '1', '2', '4'] as const;
export type Zoom = (typeof ZOOM_LEVELS)[number];
export const FIXED_ZOOMS = ['0.5', '1', '2', '4'] as const;

export const STATUS_FILTERS = ['all', 'changed', 'added', 'removed'] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

/** Review state kept in the query string, so every view is a link. */
export type ReviewParams = {
	/** The capture in view. */
	capture: string | undefined;
	/** Whether to outline where the images differ. */
	highlight: boolean;
	/** Whether examples with every theme viewed are left out. */
	hideViewed: boolean;
	layout: Layout;
	pane: Pane;
	query: string;
	status: StatusFilter;
	/** The zoom of the capture in view. */
	zoom: Zoom;
};

/**
 * Reads the review state. Links from before the single-image layout keep working: `view=diff`
 * shows the diff image, and `view=side` and `view=overlay` open those layouts.
 */
export function parseReviewParams(search: string): ReviewParams {
	const params = new URLSearchParams(search);
	const view = params.get('view');
	return {
		capture: params.get('capture') ?? undefined,
		hideViewed: params.get('hide') === 'viewed',
		highlight: params.get('highlight') !== 'off',
		layout: oneOf(LAYOUTS, view, 'single'),
		pane: view === 'diff' ? 'diff' : oneOf(PANES, params.get('pane'), 'actual'),
		query: params.get('q') ?? '',
		status: oneOf(STATUS_FILTERS, params.get('status'), 'all'),
		zoom: oneOf(ZOOM_LEVELS, params.get('zoom'), 'fit'),
	};
}

/** The query string values for a review state, leaving out each default. */
export function reviewParamValues(
	params: Omit<ReviewParams, 'capture'>,
): Record<string, string | undefined> {
	return {
		hide: params.hideViewed ? 'viewed' : undefined,
		highlight: params.highlight ? undefined : 'off',
		pane: params.layout === 'single' && params.pane !== 'actual' ? params.pane : undefined,
		q: params.query || undefined,
		status: params.status === 'all' ? undefined : params.status,
		view: params.layout === 'single' ? undefined : params.layout,
		zoom: params.zoom === 'fit' ? undefined : params.zoom,
	};
}

/** Captures matching the status filter and every whitespace-separated term of the query. */
export function filterCaptures(
	captures: ReadonlyArray<Capture>,
	filter: { query: string; status: StatusFilter },
): Array<Capture> {
	const terms = filter.query.toLowerCase().split(' ').filter(Boolean);
	return captures.filter((capture) => {
		if (filter.status !== 'all' && capture.status !== filter.status) return false;
		return terms.every((term) => capture.id.includes(term));
	});
}

/** The next zoom level in `direction`, stopping at the smallest and largest. */
export function stepZoom(zoom: Zoom, direction: -1 | 1): Zoom {
	// A fitted image is never scaled up, so zooming in from it starts at actual size. Any fixed level
	// could be larger than a fitted image, so zooming out from a fit keeps it.
	if (zoom === 'fit' || zoom === 'screen') return direction === 1 ? '1' : zoom;
	const index = FIXED_ZOOMS.indexOf(zoom) + direction;
	return FIXED_ZOOMS[Math.min(Math.max(index, 0), FIXED_ZOOMS.length - 1)] ?? '1';
}

export const STATUS_LABELS = {
	added: 'Added',
	changed: 'Changed',
	removed: 'Removed',
} as const satisfies Record<CaptureStatus, string>;

function oneOf<const T extends string>(
	values: ReadonlyArray<T>,
	value: string | null,
	fallback: T,
): T {
	return values.find((candidate) => candidate === value) ?? fallback;
}
