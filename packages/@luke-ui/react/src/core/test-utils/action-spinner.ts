import { expect, onTestFinished } from 'vite-plus/test';

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

/**
 * Asserts that a spinner appeared no sooner than `delayMs` after the Action started.
 *
 * The 1ms tolerance covers clock granularity. Do not add a tight upper bound, because scheduling
 * delays can be arbitrary.
 */
export async function expectDelayedSpinner(
	spinner: ReturnType<typeof watchSpinner>,
	startedAt: () => number | undefined,
	delayMs: number,
) {
	await expect.poll(spinner.appearedAt).toBeDefined();
	const started = startedAt();
	const appeared = spinner.appearedAt();
	if (started === undefined || appeared === undefined) {
		throw new Error('Expected the Action to start and the spinner to appear.');
	}

	expect(appeared - started).toBeGreaterThanOrEqual(delayMs - 1);
}
