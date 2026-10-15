import { breakpoints } from '@luke-ui/react/theme';
import { useSyncExternalStore } from 'react';

/** Same tablet threshold the playground panel CSS uses via `docsTabletMinInlineSize`. */
export const PLAYGROUND_DESKTOP_BREAKPOINT = breakpoints.bp768;

/**
 * Whether the playground host is in its desktop (side-by-side) panel layout. CSS already flips the
 * visible flex direction at this size; JS needs the same signal so `react-resizable-panels` uses a
 * matching orientation.
 *
 * Observes `<html>` and reads `clientWidth` so the result agrees with the unnamed `@container`
 * queries that measure the root container, rather than `matchMedia`, which can disagree when a
 * classic scrollbar is present.
 */
export function useIsDesktop() {
	return useSyncExternalStore(
		subscribeToRootInlineSize,
		getIsDesktopSnapshot,
		getIsDesktopServerSnapshot,
	);
}

function subscribeToRootInlineSize(onStoreChange: () => void) {
	const observer = new ResizeObserver(onStoreChange);
	observer.observe(document.documentElement);
	return () => {
		observer.disconnect();
	};
}

function getIsDesktopSnapshot() {
	return document.documentElement.clientWidth >= PLAYGROUND_DESKTOP_BREAKPOINT;
}

function getIsDesktopServerSnapshot() {
	return false;
}
