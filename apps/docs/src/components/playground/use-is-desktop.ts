import { breakpoints } from '@luke-ui/react/theme';
import { createInlineSizeAtLeastHook } from '../../lib/docs-container-queries.js';

/** Same tablet threshold the playground panel CSS uses via `docsTabletMinInlineSize`. */
export const PLAYGROUND_DESKTOP_BREAKPOINT = breakpoints.bp768;

/**
 * Whether the playground host is in its desktop (side-by-side) panel layout. CSS already flips the
 * visible flex direction at this size; JS needs the same signal so `react-resizable-panels` uses a
 * matching orientation.
 *
 * Observes `<html>`, the container those unnamed queries resolve against outside the docs shell.
 */
export const useIsDesktop = createInlineSizeAtLeastHook(() => document.documentElement, {
	unit: 'px',
	value: PLAYGROUND_DESKTOP_BREAKPOINT,
});
