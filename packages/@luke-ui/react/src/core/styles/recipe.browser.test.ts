import { expect, test } from 'vite-plus/test';
import { fieldRecipe } from '../primitives/field/recipe.js';
import { inputGroupRecipe } from '../primitives/input-group/recipe.js';

test('a slotted recipe resolves a full stylex.props(...) result per slot', () => {
	expect(typeof fieldRecipe().root.className).toBe('string');
	expect(typeof inputGroupRecipe({ size: 'small' }).control.className).toBe('string');
});
