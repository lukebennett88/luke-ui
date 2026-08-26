import { expect, test } from 'vite-plus/test';
import { fieldRecipe } from '../primitives/field/recipe.css.js';
import { inputGroupRecipe } from '../primitives/input-group/recipe.css.js';

test('slot functions merge an optional extra class', () => {
	expect(fieldRecipe().root('extra-class').split(' ')).toContain('extra-class');
	expect(inputGroupRecipe({ size: 'small' }).control('mine').split(' ')).toContain('mine');
});
