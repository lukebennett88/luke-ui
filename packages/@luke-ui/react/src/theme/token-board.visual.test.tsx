import { expect, test } from 'vite-plus/test';
import {
	captureVisualAppearance,
	renderVisual,
	visualAppearances,
} from '../test-utils/render-visual.js';
import { TokenBoard } from './token-board.js';

// Captures every contract leaf for both bundled themes and modes. Theme v2 repainted 34/47 colour
// leaves but moved only 5 of ~122 existing captures (#249); generalising the board past colour in
// #257 closes the remaining gap, where the other 81 leaves previously had no visual capture at all —
// this board makes any future generator or semantic-mapping change produce an obvious, intentional
// diff regardless of whether a component happens to consume the changed leaf.
test.each(visualAppearances)('token board: $theme $mode', async (appearance) => {
	const scene = renderVisual(<TokenBoard />, appearance);
	await expect.element(scene).toBeVisible();

	await captureVisualAppearance(scene, 'theme/token-board', appearance);
});
