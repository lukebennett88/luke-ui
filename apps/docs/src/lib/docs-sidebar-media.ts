import { breakpoints } from '@luke-ui/react/theme';
import { useSyncExternalStore } from 'react';

const DOCS_SIDEBAR_BREAKPOINT = breakpoints.bp1024;

/** Matches the docs shell breakpoint where the desktop sidebar replaces the mobile drawer. */
export const docsSidebarMinWidth = `(min-width: ${DOCS_SIDEBAR_BREAKPOINT}px)`;
export const docsSidebarMaxWidth = `(max-width: ${DOCS_SIDEBAR_BREAKPOINT - 1}px)`;

const DOCS_SIDEBAR_MEDIA_QUERY = docsSidebarMinWidth;

export function useIsDocsSidebarLayout() {
	return useSyncExternalStore(
		subscribeToDocsSidebarMediaQuery,
		getIsDocsSidebarLayoutSnapshot,
		getIsDocsSidebarLayoutServerSnapshot,
	);
}

function subscribeToDocsSidebarMediaQuery(onStoreChange: () => void) {
	const mediaQueryList = window.matchMedia(DOCS_SIDEBAR_MEDIA_QUERY);
	mediaQueryList.addEventListener('change', onStoreChange);
	return () => {
		mediaQueryList.removeEventListener('change', onStoreChange);
	};
}

function getIsDocsSidebarLayoutSnapshot() {
	return window.matchMedia(DOCS_SIDEBAR_MEDIA_QUERY).matches;
}

function getIsDocsSidebarLayoutServerSnapshot() {
	return false;
}
