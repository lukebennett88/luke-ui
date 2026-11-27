import type { Capture, CaptureStatus } from '../report/schema.js';

const SPLIT_PATTERN = /^\d{1,3}$/;

/** One image at a time, or Compare: the actual image over the expected one, split by a divider. */
const LAYOUTS = ['single', 'compare'] as const;
export type Layout = (typeof LAYOUTS)[number];

/**
 * `fit` fits an image to the available width without scaling it up. `screen` fits the whole image
 * on screen. A number is a fixed scale.
 */
const ZOOM_LEVELS = ['fit', 'screen', '0.5', '1', '2', '4'] as const;
export type Zoom = (typeof ZOOM_LEVELS)[number];
const FIXED_ZOOMS = ['0.5', '1', '2', '4'] as const;

export const STATUS_FILTERS = ['all', 'changed', 'added', 'removed'] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

/** Review state kept in the query string, so every view is a link. */
export type ReviewParams = {
	/** The capture in view. */
	capture: string | undefined;
	/** Whether to highlight where the images differ. */
	highlight: boolean;
	/** Whether examples with every theme viewed are left out. */
	hideViewed: boolean;
	layout: Layout;
	split: number;
	query: string;
	status: StatusFilter;
	/** The zoom of the capture in view. */
	zoom: Zoom;
};

/**
 * Reads the review state. `view=side` and `view=overlay` open Compare, and `view=diff` and
 * `pane=diff` open the capture with outlines, so links in existing pull request comments resolve.
 */
export function parseReviewParams(search: string): ReviewParams {
	const params = new URLSearchParams(search);
	const view = params.get('view');
	const pane = params.get('pane');
	const isDiff = view === 'diff' || pane === 'diff';
	const isExpected = !isDiff && (view === 'expected' || pane === 'expected');
	const splitParam = params.get('split');
	const hasSplit =
		splitParam !== null && SPLIT_PATTERN.test(splitParam) && Number(splitParam) <= 100;
	const defaultSplit = isExpected ? 100 : 50;
	return {
		capture: params.get('capture') ?? undefined,
		hideViewed: params.get('hide') === 'viewed',
		highlight: isDiff || params.get('highlight') !== 'off',
		layout:
			!isDiff && (isExpected || view === 'compare' || view === 'side' || view === 'overlay')
				? 'compare'
				: 'single',
		split: hasSplit ? Number(splitParam) : defaultSplit,
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
		pane: undefined,
		split: params.layout === 'compare' && params.split !== 50 ? String(params.split) : undefined,
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
