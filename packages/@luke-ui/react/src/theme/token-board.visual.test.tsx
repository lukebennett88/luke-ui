import { expect, test } from 'vite-plus/test';
import {
	captureVisualAppearance,
	renderVisual,
	visualAppearances,
} from '../test-utils/render-visual.js';
import { TokenBoard } from './token-board.js';

// Captures every contract leaf, colour and non-colour alike, for both bundled themes and
// modes, so any generator or semantic-mapping change produces an obvious, intentional diff
// regardless of whether a component happens to consume the changed leaf.
for (const appearance of visualAppearances) {
	test(`token board: ${appearance.theme} ${appearance.mode}`, async () => {
		const scene = renderVisual(<TokenBoard />, appearance);
		await expect.element(scene).toBeVisible();

		await captureVisualAppearance(scene, 'theme/token-board', appearance);
	});
}
