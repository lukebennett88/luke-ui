export interface SearchAnchorRect {
	height: number;
	left: number;
	top: number;
	width: number;
}

export function measureSearchAnchor(element: HTMLElement | null): SearchAnchorRect | null {
	if (!element) return null;
	let rect = element.getBoundingClientRect();
	// The open-state slot reserve is visibility:hidden and can measure as zero width.
	if (rect.width === 0 && element.parentElement) {
		rect = element.parentElement.getBoundingClientRect();
	}
	return {
		height: rect.height,
		left: rect.left,
		top: rect.top,
		width: rect.width,
	};
}

export function isSearchTriggerVisible(element: HTMLElement | null) {
	if (!element) return false;
	return element.getClientRects().length > 0;
}

const SEARCH_PANEL_MAX_WIDTH = 608;
const SEARCH_PANEL_HORIZONTAL_INSET = 16;
const SEARCH_PANEL_TOP_MAX_REM = 8;
const SEARCH_PANEL_TOP_VIEWPORT_RATIO = 0.15;

/** Lay out the open panel as a centred command-palette card; keep trigger height for the morph. */
export function fitSearchAnchorToViewport(
	anchor: SearchAnchorRect,
	viewportWidth = window.innerWidth,
	viewportHeight = window.innerHeight,
	rootFontSizePx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16,
): SearchAnchorRect {
	const maxWidth = Math.min(
		SEARCH_PANEL_MAX_WIDTH,
		viewportWidth - SEARCH_PANEL_HORIZONTAL_INSET * 2,
	);
	const width = maxWidth;
	const left = (viewportWidth - width) / 2;
	const top = Math.min(
		viewportHeight * SEARCH_PANEL_TOP_VIEWPORT_RATIO,
		SEARCH_PANEL_TOP_MAX_REM * rootFontSizePx,
	);
	return {
		...anchor,
		height: anchor.height,
		left,
		top,
		width,
	};
}
