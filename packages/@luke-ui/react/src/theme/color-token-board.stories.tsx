import { expect } from 'storybook/test';
import preview from '../../.storybook/preview.js';
import { ColorTokenBoard } from './color-token-board.js';

const meta = preview.meta({
	component: ColorTokenBoard,
	tags: ['theme'],
	title: 'Theme/Color token board',
});

/**
 * Every `color.*` semantic contract leaf, resolved for the active theme and colour mode. Switch the
 * theme and colour mode in the Storybook toolbar to compare. Captured in full by
 * `color-token-board.visual.test.tsx` across both bundled themes and modes, so a generator or
 * mapping change produces an obvious visual diff even where no component happens to consume the
 * changed leaf (theme-v2 #249).
 */
export const Board = meta.story({
	play: async ({ canvasElement }) => {
		const swatches = canvasElement.querySelectorAll('[role="img"]');
		await expect(swatches.length).toBeGreaterThan(0);
	},
});
