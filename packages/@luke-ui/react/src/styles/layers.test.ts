import { expect, test } from 'vite-plus/test';
import { lukeLayerOrder } from './layer-order.js';

test('declares cascade layers from lowest to highest priority', () => {
	expect(lukeLayerOrder).toEqual(['reset', 'base', 'tokens', 'recipes', 'box', 'utilities']);
});
