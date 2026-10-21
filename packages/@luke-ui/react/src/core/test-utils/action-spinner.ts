import { onTestFinished } from 'vite-plus/test';

/**
 * Records when a `[role="status"]` spinner first appears inside `element`.
 *
 * Measuring from the DOM mutation, not from a polled read, keeps the timestamp independent of how
 * late the test body gets scheduled on a loaded machine.
 */
export function watchSpinner(element: Element) {
	let appearedAt: number | undefined;
	const observer = new MutationObserver(() => {
		if (appearedAt === undefined && element.querySelector('[role="status"]')) {
			appearedAt = performance.now();
			observer.disconnect();
		}
	});
	observer.observe(element, { childList: true, subtree: true });
	onTestFinished(() => observer.disconnect());

	return { appearedAt: () => appearedAt };
}
