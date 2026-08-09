import { expect } from 'vite-plus/test';

/**
 * Waits for an overlay to finish entering, so a test interacts with it at rest.
 *
 * React Aria's `useEnterAnimation` clears `data-entering` when the CSS
 * transition starts, not when it ends. The attribute alone therefore still
 * leaves the overlay mid-animation, so the running animations have to be
 * waited on as well.
 */
export async function waitForOverlayEnter(element: Element) {
	await expect.poll(() => element.hasAttribute('data-entering')).toBe(false);
	await expect.poll(() => element.getAnimations({ subtree: true }).length).toBe(0);
}
