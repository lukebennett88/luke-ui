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
 * Compare every resolved contract leaf across themes and colour modes. The visual test detects
 * mapping changes even when no component consumes the affected leaf.
 */
export const Board = meta.story({
	play: async ({ canvasElement }) => {
		// Derive the expected count from the contract so this assertion detects missing samples.
		const swatches = canvasElement.querySelectorAll('[role="img"]');
		await expect(swatches.length).toBe(contractLeafCount);
	},
});
