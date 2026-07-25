import { expect } from 'storybook/test';
import preview from '../../.storybook/preview.js';
import { flattenThemeContract } from './contract.js';
import { TokenBoard } from './token-board.js';

const meta = preview.meta({
	component: TokenBoard,
	tags: ['theme'],
	title: 'Theme/Token board',
});

const contractLeafCount = flattenThemeContract().length;

/**
 * Every contract leaf, resolved for the active theme and colour mode. Switch the theme and colour
 * mode in the Storybook toolbar to compare. Captured in full by `token-board.visual.test.tsx` across
 * both bundled themes and modes, so a generator or mapping change produces an obvious visual diff
 * even where no component happens to consume the changed leaf (theme-v2 #249, generalised past
 * colour in #257).
 */
export const Board = meta.story({
	play: async ({ canvasElement }) => {
		// Derived from the contract, not hardcoded, so the board's own claim that coverage cannot
		// drift out of sync with the contract is actually enforced: this fails the moment a rendered
		// sample count and the contract's total leaf count disagree.
		const swatches = canvasElement.querySelectorAll('[role="img"]');
		await expect(swatches.length).toBe(contractLeafCount);
	},
});
