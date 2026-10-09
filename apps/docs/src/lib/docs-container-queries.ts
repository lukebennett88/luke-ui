import { breakpoints } from '@luke-ui/react/theme';
import { useSyncExternalStore } from 'react';

/*
 * Size conditions for docs-owned styles, written as unnamed `@container` queries.
 *
 * The only container in the docs app is `:root`. Luke UI's generated stylesheet declares
 * `:where(:root) { container-type: inline-size }`, and `app.css` imports it. Unnamed queries
 * resolve against the nearest ancestor container, so while nothing below `:root` sets
 * `container-type`, every condition here measures the root's inline size, which is the viewport
 * minus any classic scrollbar. Do not add a container below the root without naming it and
 * pointing the shell-synchronised queries (sidebar, table of contents, header navigation) at the
 * root: they would otherwise resolve against the new inner container. A query with no matching
 * container never matches, so removing the root containment silently collapses these styles to
 * their base values.
 */

function atLeast(inlineSize: number) {
	return `(inline-size >= ${inlineSize}px)`;
}

function below(inlineSize: number) {
	return `(inline-size < ${inlineSize}px)`;
}

/** Tablet and up. Header spacing and the content gutter widen here. */
export const docsTabletMinInlineSize = atLeast(breakpoints.bp768);
/** Below tablet. The header moves its destination links to their own row. */
export const docsTabletMaxInlineSize = below(breakpoints.bp768);

const DOCS_SIDEBAR_BREAKPOINT = breakpoints.bp1024;

/** The docs shell breakpoint where the desktop sidebar replaces the mobile drawer. */
export const docsSidebarMinInlineSize = atLeast(DOCS_SIDEBAR_BREAKPOINT);
/** Below the sidebar breakpoint, where the drawer holds the docs navigation. */
export const docsSidebarMaxInlineSize = below(DOCS_SIDEBAR_BREAKPOINT);

/** The docs shell breakpoint where the table of contents moves into its own column. */
export const docsTocMinInlineSize = atLeast(breakpoints.bp1280);

/** Builds a condition at an exact inline size, for a layout that fits at a measured width. */
export const docsMinInlineSize = atLeast;
/** Builds a condition below an exact inline size, for a layout that fits at a measured width. */
export const docsMaxInlineSize = below;

/**
 * Whether the docs shell is in its sidebar layout. CSS hides the drawer trigger by itself. JS
 * needs this to close an open modal drawer when the layout crosses into the sidebar layout,
 * because a hidden trigger does not release the modal's focus trap and scroll lock.
 *
 * It observes `<html>`, the root container, and reads `clientWidth`, which is the container's
 * inline size. `matchMedia` would count a classic scrollbar and disagree with the CSS.
 */
export function useIsDocsSidebarLayout() {
	return useSyncExternalStore(
		subscribeToRootInlineSize,
		getIsDocsSidebarLayoutSnapshot,
		getIsDocsSidebarLayoutServerSnapshot,
	);
}

function subscribeToRootInlineSize(onStoreChange: () => void) {
	const observer = new ResizeObserver(onStoreChange);
	observer.observe(document.documentElement);
	return () => {
		observer.disconnect();
	};
}

function getIsDocsSidebarLayoutSnapshot() {
	return document.documentElement.clientWidth >= DOCS_SIDEBAR_BREAKPOINT;
}

function getIsDocsSidebarLayoutServerSnapshot() {
	return false;
}
