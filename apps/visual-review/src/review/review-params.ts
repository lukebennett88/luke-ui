import type { Capture, CaptureStatus } from '../report/schema.js';

export const VIEW_MODES = ['side', 'overlay', 'diff'] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

/** `fit` scales an image down to the available width. A number is a fixed scale. */
export const ZOOM_LEVELS = ['fit', '0.5', '1', '2', '4'] as const;
export type Zoom = (typeof ZOOM_LEVELS)[number];

export const STATUS_FILTERS = ['all', 'changed', 'added', 'removed'] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

/** Review state kept in the query string, so every view is a link. */
export type ReviewParams = {
	capture: string | undefined;
	/** Whether to outline where the images differ. */
	highlight: boolean;
	query: string;
	status: StatusFilter;
	view: ViewMode;
	zoom: Zoom;
};

export function parseReviewParams(search: string): ReviewParams {
	const params = new URLSearchParams(search);
	return {
		capture: params.get('capture') ?? undefined,
		highlight: params.get('highlight') !== 'off',
		query: params.get('q') ?? '',
		status: oneOf(STATUS_FILTERS, params.get('status'), 'all'),
		view: oneOf(VIEW_MODES, params.get('view'), 'side'),
		zoom: oneOf(ZOOM_LEVELS, params.get('zoom'), 'fit'),
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

/** The capture `offset` places from `currentId`, stopping at either end of the list. */
export function stepCapture(
	captures: ReadonlyArray<Capture>,
	currentId: string | undefined,
	offset: number,
): Capture | undefined {
	const index = captures.findIndex((capture) => capture.id === currentId);
	if (index === -1) return captures[0];
	return captures[Math.min(Math.max(index + offset, 0), captures.length - 1)];
}

/** The next zoom level in `direction`, stopping at the smallest and largest. */
export function stepZoom(zoom: Zoom, direction: -1 | 1): Zoom {
	// `fit` never scales up, so zooming in from it starts at actual size. Any fixed level could be
	// larger than a fitted image, so zooming out from it stays at `fit`.
	if (zoom === 'fit') return direction === 1 ? '1' : 'fit';
	const index = ZOOM_LEVELS.indexOf(zoom) + direction;
	return ZOOM_LEVELS[Math.min(Math.max(index, 1), ZOOM_LEVELS.length - 1)] ?? '1';
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
