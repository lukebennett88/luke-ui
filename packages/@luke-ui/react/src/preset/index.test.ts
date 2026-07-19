import { expect, test } from 'vite-plus/test';
import { lukeLayerOrder, lukeLayerOrderStarter } from './index.js';

test('exports the stable Luke UI layer-order starter', () => {
	expect(lukeLayerOrder).toEqual(['reset', 'base', 'tokens', 'recipes', 'box', 'utilities']);
	expect(lukeLayerOrderStarter).toBe('@layer reset, base, tokens, recipes, box, utilities;');
});
