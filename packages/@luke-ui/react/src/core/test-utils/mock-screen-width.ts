/** Desktop `window.screen.width` for package browser setup and visual captures. */
export const DESKTOP_SCREEN_WIDTH = 1024;

/** Below the `bp640` mobile breakpoint for tray / mobile-modal tests. */
export const MOBILE_SCREEN_WIDTH = 390;

/**
 * Sets `window.screen.width` for the test. `useIsMobileDevice` reads that property rather than
 * the window width. Call before render: the hook only re-reads on resize, and this mock does not
 * fire one.
 */
export function mockScreenWidth(width: number): void {
	if (window.screen.width === width) return;

	Object.defineProperty(window.screen, 'width', { configurable: true, value: width });
}
