import { expect, test } from 'vite-plus/test';
import {
	captureVisualAppearance,
	renderVisual,
	visualAppearances,
} from '../test-utils/render-visual.js';
import { ColorTokenBoard } from './color-token-board.js';

// Captures every `color.*` contract leaf for both bundled themes and modes. Theme v2 repainted
// 34/47 leaves but moved only 5 of ~122 existing captures (#249) — this board makes any future
// generator or semantic-mapping change produce an obvious, intentional diff regardless of whether a
// component happens to consume the changed leaf.
test.each(visualAppearances)('semantic colour token board: $theme $mode', async (appearance) => {
	const scene = renderVisual(<ColorTokenBoard />, appearance);
	await expect.element(scene).toBeVisible();

	await captureVisualAppearance(scene, 'theme/color-token-board', appearance);
});
