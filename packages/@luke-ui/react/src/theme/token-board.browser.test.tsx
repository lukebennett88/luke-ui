import { expect, test } from 'vite-plus/test';
import { render, visualAppearances } from '../core/test-utils/render.js';
import { captureVisualAppearance } from '../core/test-utils/visual.js';
import { TokenBoard } from './token-board.js';

// Captures every contract leaf, colour and non-colour alike, for both bundled themes and
// modes, so any generator or semantic-mapping change produces an obvious, intentional diff
// regardless of whether a component happens to consume the changed leaf.
test('token board', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator, unmount } = render(<TokenBoard />, { appearance });
		// eslint-disable-next-line no-await-in-loop -- each capture resizes the shared viewport
		await expect.element(locator).toBeVisible();
		// ResolvedValue fills in after layout; wait so the capture never includes "Resolving…".
		// eslint-disable-next-line no-await-in-loop -- each capture resizes the shared viewport
		await expect
			.poll(() => locator.element().textContent?.includes('Resolving…') ?? true)
			.toBe(false);

		// eslint-disable-next-line no-await-in-loop -- each capture resizes the shared viewport
		await captureVisualAppearance(locator, 'theme/token-board', appearance);
		// Unmount before the next appearance flips `data-color-mode`, or ResolvedValue's
		// MutationObserver setStates fire outside `act` on the previous board.
		unmount();
	}
});
