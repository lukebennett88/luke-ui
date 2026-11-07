import { breakpoints } from '@luke-ui/react/theme';
import { useSyncExternalStore } from 'react';

/*
 * Size conditions for docs-owned styles, written as `@container` queries.
 *
 * There are three kinds of container in the docs app:
 *
 * - `site-header` is the header element. Its row switches between the compact and desktop layouts
 *   at `SITE_HEADER_DESKTOP_MIN`, which is measured from the desktop row's content. Queries inside
 *   the header name it.
 * - `docs-shell` wraps the docs sidebar, header and panel. The sidebar shows at
 *   `DOCS_SIDEBAR_MIN`. It is an ancestor of the header too, so the header can ask about it.
 * - `:root` is the container Luke UI's generated stylesheet declares with
 *   `:where(:root) { container-type: inline-size }`, and `app.css` imports it.
 *
 * The article, table of contents, playground and example gutters are still unnamed queries. They
 * resolve against the nearest container, which is `docs-shell` inside the docs and `:root`
 * elsewhere. Both are as wide as the viewport minus any classic scrollbar, so they agree. A query
 * measures the container's content box, so a container that sets inline padding measures less than
 * its border box. The header and the shell keep their padding on inner elements for that reason.
 * A query with no matching container never matches, so a condition below that loses its container
 * silently collapses to its base values.
 *
 * Thresholds that follow content are in `rem`, so a larger text size switches layouts earlier. A
 * `rem` in a container query resolves against the root font size, not the container's own.
 */

/** A length for a container query or a JS size check. */
export interface InlineSizeThreshold {
	unit: 'px' | 'rem';
	value: number;
}

export const SITE_HEADER_CONTAINER = 'site-header';
export const DOCS_SHELL_CONTAINER = 'docs-shell';

/** The `id` that JS uses to find the header container. */
export const SITE_HEADER_ID = 'site-header';
/** The `id` that JS uses to find the docs shell container. */
export const DOCS_SHELL_ID = 'docs-shell';

/**
 * The header row switches from compact to desktop here. The desktop row (wordmark, sidebar toggle,
 * three links, search, Theme and GitHub) measures about 37rem (595px) in the widest case, so this leaves
 * about 3rem of slack for a wider fallback font. `site-header.browser.test.tsx` fails if the row would
 * overflow, so keep it above the measurement.
 */
const SITE_HEADER_DESKTOP_MIN: InlineSizeThreshold = { unit: 'rem', value: 40 };

/**
 * The docs shell shows the sidebar from here. It is `rem` because the sidebar is `17rem` wide: at a
 * larger text size the sidebar takes more of the line, so the shell should drop to the drawer
 * sooner. At the default 16px font size this is the 1024px the docs used before.
 */
const DOCS_SIDEBAR_MIN: InlineSizeThreshold = { unit: 'rem', value: 64 };

function toCssLength({ unit, value }: InlineSizeThreshold) {
	return `${value}${unit}`;
}

function atLeast(inlineSize: number) {
	return `(inline-size >= ${inlineSize}px)`;
}

/** Tablet and up. The article gutter and the playground and example layouts change here. */
export const docsTabletMinInlineSize = atLeast(breakpoints.bp768);

/**
 * Viewport media query at the same tablet threshold as `docsTabletMinInlineSize`. Use this only
 * when a rule sits inside a named `@container` and cannot measure the root — unnamed queries would
 * resolve against the inner container instead.
 */
export const docsTabletMinWidthMedia = `(min-width: ${breakpoints.bp768}px)`;

/** The named `site-header` container at or above its desktop threshold. */
export const siteHeaderDesktopMinInlineSize = `${SITE_HEADER_CONTAINER} (inline-size >= ${toCssLength(SITE_HEADER_DESKTOP_MIN)})`;

/** Builds the desktop condition for a container other than the header that must change in step. */
export function atLeastSiteHeaderDesktop(containerName: string) {
	return `${containerName} (inline-size >= ${toCssLength(SITE_HEADER_DESKTOP_MIN)})`;
}

/** The `docs-shell` container at or above the sidebar threshold. */
export const docsSidebarMinInlineSize = `${DOCS_SHELL_CONTAINER} (inline-size >= ${toCssLength(DOCS_SIDEBAR_MIN)})`;

/** The docs shell breakpoint where the table of contents moves into its own column. */
export const docsTocMinInlineSize = atLeast(breakpoints.bp1280);

/**
 * Builds a hook that reports whether a container's inline size is at least a threshold, measured
 * the way a container query measures it: the content box, with `rem` against the root font size.
 *
 * CSS decides the visible layout by itself. JS needs the same answer for behaviour that CSS cannot
 * release, such as closing a modal drawer whose trigger became hidden, or choosing a panel
 * orientation. Observing the element the query names keeps the two in agreement. `matchMedia`
 * would count a classic scrollbar and disagree.
 *
 * The server snapshot is `false`, and so is the snapshot while the element is missing. Create each
 * hook once at module scope, so its subscription stays stable across renders.
 */
export function createInlineSizeAtLeastHook(
	getElement: () => HTMLElement | null,
	threshold: InlineSizeThreshold,
) {
	function subscribe(onStoreChange: () => void) {
		const element = getElement();
		if (!element) return () => {};
		const observer = new ResizeObserver(onStoreChange);
		observer.observe(element);
		return () => {
			observer.disconnect();
		};
	}

	function getSnapshot() {
		const element = getElement();
		if (!element) return false;
		return getContentInlineSize(element) >= toPixels(threshold);
	}

	return function useInlineSizeAtLeast() {
		return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
	};
}

function getServerSnapshot() {
	return false;
}

function getContentInlineSize(element: HTMLElement) {
	const { paddingInlineEnd, paddingInlineStart } = getComputedStyle(element);
	return element.clientWidth - parseFloat(paddingInlineStart) - parseFloat(paddingInlineEnd);
}

function toPixels({ unit, value }: InlineSizeThreshold) {
	if (unit === 'px') return value;
	return value * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

/** The pixel value of the docs sidebar threshold, for tests. */
export function getDocsSidebarMinPixels() {
	return toPixels(DOCS_SIDEBAR_MIN);
}

/** The pixel value of the header's desktop threshold, for tests. */
export function getSiteHeaderDesktopMinPixels() {
	return toPixels(SITE_HEADER_DESKTOP_MIN);
}

/**
 * Whether the docs shell is in its sidebar layout. Closes an open modal drawer when the shell
 * crosses into the sidebar layout.
 */
export const useIsDocsSidebarLayout = createInlineSizeAtLeastHook(
	() => document.getElementById(DOCS_SHELL_ID),
	DOCS_SIDEBAR_MIN,
);

/** Whether the site header row is in its desktop layout. */
export const useIsSiteHeaderDesktop = createInlineSizeAtLeastHook(
	() => document.getElementById(SITE_HEADER_ID),
	SITE_HEADER_DESKTOP_MIN,
);
