import { expect, test } from 'vite-plus/test';
import { render, visualAppearances } from '../core/test-utils/render.js';
import { captureVisualAppearance } from '../core/test-utils/visual.js';
import { codeFontFamilyStack } from './foundation.js';
import { TokenBoard } from './token-board.js';

test('token board displays the generated code font token', async () => {
	const { locator } = render(<TokenBoard />);
	await expect.element(locator).toBeVisible();
	await expect
		.poll(() => locator.element().textContent?.includes('Resolving…') ?? true)
		.toBe(false);

	expect(locator.element().textContent).toContain(codeFontFamilyStack);
	expect(
		getComputedStyle(document.documentElement).getPropertyValue('--luke-font-family-code').trim(),
	).toBe(codeFontFamilyStack);
});

// Captures every contract leaf, colour and non-colour alike, for both bundled themes and
// modes, so any generator or semantic-mapping change produces an obvious, intentional diff
// regardless of whether a component happens to consume the changed leaf.
test('token board', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator, unmount } = render(<TokenBoard />, { appearance });
		// Each capture resizes the shared viewport.
		// oxlint-disable-next-line no-await-in-loop
		await expect.element(locator).toBeVisible();
		// ResolvedValue fills in after layout; wait so the capture never includes "Resolving…".
		// Each capture resizes the shared viewport.
		// oxlint-disable-next-line no-await-in-loop
		await expect
			.poll(() => locator.element().textContent?.includes('Resolving…') ?? true)
			.toBe(false);

		// Each capture resizes the shared viewport.
		// oxlint-disable-next-line no-await-in-loop
		await captureVisualAppearance(locator, 'theme/token-board', appearance);
		// Unmount before the next appearance flips `data-color-mode`, or ResolvedValue's
		// MutationObserver setStates fire outside `act` on the previous board.
		unmount();
	}
});

// The custom fixture makes difficult yellow, green, and red source colours visible in both modes.
for (const mode of ['light', 'dark'] as const) {
	test(`chromatic source colours: ${mode}`, { tags: ['visual'] }, async () => {
		const appearance = { mode, theme: 'chromatic' } as const;
		const { locator } = render(<TokenBoard />, { appearance });
		await expect.element(locator).toBeVisible();
		await expect
			.poll(() => locator.element().textContent?.includes('Resolving…') ?? true)
			.toBe(false);
		await captureVisualAppearance(locator, 'theme/chromatic-source-colours', appearance);
	});
}
