import { breakpoints } from '@luke-ui/react/theme';
import { useSyncExternalStore } from 'react';

/*
 * Size conditions for docs-owned styles, written as `@container` queries.
 *
 * Named containers: `site-header`, `docs-shell` (an ancestor of the header, so the header can ask
 * whether the sidebar shows), and `site-frame` in `site-frame.css.ts`. Unnamed queries resolve
 * against the nearest container: `docs-shell` in the docs and `:root` elsewhere, which Luke UI's
 * stylesheet declares. Both are as wide as the viewport minus any classic scrollbar, so they agree.
 *
 * A query measures the content box, so containers keep their padding on an inner element. A query
 * with no matching container never matches, so a lost container silently collapses its styles.
 * Thresholds that follow content are in `rem`, which resolves against the root font size.
 */

/** A length for a container query or a JS size check. */
export interface InlineSizeThreshold {
	unit: 'px' | 'rem';
	value: number;
}

export const SITE_HEADER_CONTAINER = 'site-header';
export const DOCS_SHELL_CONTAINER = 'docs-shell';

export const SITE_HEADER_ID = 'site-header';
export const DOCS_SHELL_ID = 'docs-shell';

/**
 * The desktop header row measures about 37rem at its widest. `docs-shell.browser.test.tsx` fails if
 * this drops below the row's width.
 */
const SITE_HEADER_DESKTOP_MIN: InlineSizeThreshold = { unit: 'rem', value: 40 };

/** In `rem` because the sidebar is, so a larger text size drops to the drawer sooner. */
const DOCS_SIDEBAR_MIN: InlineSizeThreshold = { unit: 'rem', value: 64 };

function atLeast(inlineSize: number) {
	return `(inline-size >= ${inlineSize}px)`;
}

function namedAtLeast(containerName: string, { unit, value }: InlineSizeThreshold) {
	return `${containerName} (inline-size >= ${value}${unit})`;
}

/** Tablet and up. The article gutter and the playground and example layouts change here. */
export const docsTabletMinInlineSize = atLeast(breakpoints.bp768);

/**
 * Viewport media query at the same tablet threshold as `docsTabletMinInlineSize`. Use this only
 * when a rule sits inside a named `@container` and cannot measure the root — unnamed queries would
 * resolve against the inner container instead.
 */
export const docsTabletMinWidthMedia = `(min-width: ${breakpoints.bp768}px)`;

export const siteHeaderDesktopMinInlineSize = namedAtLeast(
	SITE_HEADER_CONTAINER,
	SITE_HEADER_DESKTOP_MIN,
);

/** The header's desktop threshold, for a container that must switch with it. */
export function atLeastSiteHeaderDesktop(containerName: string) {
	return namedAtLeast(containerName, SITE_HEADER_DESKTOP_MIN);
}

export const docsSidebarMinInlineSize = namedAtLeast(DOCS_SHELL_CONTAINER, DOCS_SIDEBAR_MIN);

/** The docs shell breakpoint where the table of contents moves into its own column. */
export const docsTocMinInlineSize = atLeast(breakpoints.bp1280);

/**
 * Builds a hook that answers a container query in JS, for behaviour CSS cannot handle, such as
 * closing a drawer whose trigger became hidden. It measures the element the way the query does;
 * `matchMedia` would count a classic scrollbar and disagree. `false` on the server and while the
 * element is missing. Call it at module scope so the subscription stays stable.
 *
 * A `rem` threshold also changes when the root font size does, which resizes no container. So the
 * subscription observes a hidden element one threshold wide, which resizes with `rem`.
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
		const sentinel = threshold.unit === 'rem' ? createThresholdSentinel(threshold) : null;
		if (sentinel) observer.observe(sentinel);
		return () => {
			observer.disconnect();
			sentinel?.remove();
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

function createThresholdSentinel({ unit, value }: InlineSizeThreshold) {
	const sentinel = document.createElement('div');
	sentinel.setAttribute('aria-hidden', 'true');
	sentinel.style.cssText = `block-size:0;inline-size:${value}${unit};overflow:hidden;pointer-events:none;position:absolute;visibility:hidden`;
	return document.documentElement.appendChild(sentinel);
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

/** For tests. */
export function getDocsSidebarMinPixels() {
	return toPixels(DOCS_SIDEBAR_MIN);
}

/** For tests. */
export function getSiteHeaderDesktopMinPixels() {
	return toPixels(SITE_HEADER_DESKTOP_MIN);
}

export const useIsDocsSidebarLayout = createInlineSizeAtLeastHook(
	() => document.getElementById(DOCS_SHELL_ID),
	DOCS_SIDEBAR_MIN,
);

export const useIsSiteHeaderDesktop = createInlineSizeAtLeastHook(
	() => document.getElementById(SITE_HEADER_ID),
	SITE_HEADER_DESKTOP_MIN,
);
