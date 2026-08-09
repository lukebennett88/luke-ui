import { expect } from 'vite-plus/test';

/**
 * Waits for an overlay to finish entering, so a test can interact with settled
 * content instead of a moving, re-rendering one.
 *
 * React Aria's `useEnterAnimation` clears `data-entering` when the CSS
 * transition starts rather than when it ends, so that attribute alone still
 * leaves the overlay mid-animation. The running animations have to be waited
 * on as well.
 */
export async function waitForOverlayEnter(element: Element) {
	await expect.poll(() => element.hasAttribute('data-entering')).toBe(false);
	await expect.poll(() => element.getAnimations({ subtree: true }).length).toBe(0);
}
