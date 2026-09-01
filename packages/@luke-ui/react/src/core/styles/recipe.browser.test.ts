import { expect, test } from 'vite-plus/test';
import { fieldRecipe } from '../primitives/field/recipe.js';
import { inputGroupRecipe } from '../primitives/input-group/recipe.js';

test('slot functions merge an optional extra class', () => {
	expect(fieldRecipe().root('extra-class').split(' ')).toContain('extra-class');
	expect(inputGroupRecipe({ size: 'small' }).control('mine').split(' ')).toContain('mine');
});
