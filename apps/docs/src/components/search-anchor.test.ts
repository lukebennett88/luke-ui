import { expect, test } from 'vite-plus/test';
import { fitSearchAnchorToViewport } from './search-anchor.js';

test('fitSearchAnchorToViewport clamps panel width on narrow viewports', () => {
	const anchor = { height: 40, left: 0, top: 0, width: 200 };
	const layout = fitSearchAnchorToViewport(anchor, 400, 600, 16);
	expect(layout.width).toBe(368);
	expect(layout.left).toBe(16);
});
