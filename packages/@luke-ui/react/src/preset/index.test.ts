import { expect, test } from 'vite-plus/test';
import { lukeLayerOrder, lukeLayerOrderStarter, lukePreset } from './index.js';

test('exports the stable Luke UI layer-order starter', () => {
	expect(lukeLayerOrder).toEqual(['reset', 'base', 'tokens', 'recipes', 'box', 'utilities']);
	expect(lukeLayerOrderStarter).toBe('@layer reset, base, tokens, recipes, box, utilities;');
});

test('exports the semantic Panda token aliases without component or global CSS', () => {
	expect(lukePreset.name).toBe('@luke-ui/react');
	expect(lukePreset.theme?.tokens).toMatchObject({
		colors: {
			text: { primary: { value: 'var(--luke-color-text-primary)' } },
		},
		lineHeights: { 700: { value: 'var(--luke-font-700-line-height)' } },
		sizes: {
			controlSize: { small: { value: 'var(--luke-control-size-small)' } },
		},
	});
	expect(lukePreset).not.toHaveProperty('globalCss');
	expect(lukePreset.theme).not.toHaveProperty('recipes');
	expect(lukePreset.theme).not.toHaveProperty('slotRecipes');
});
