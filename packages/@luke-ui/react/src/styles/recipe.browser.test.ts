import { expect, test } from 'vite-plus/test';
import { fieldRecipe } from '../primitives/field/recipe.css.js';
import { inputGroupRecipe } from '../primitives/input-group/recipe.css.js';
import {
	nestedArrayFixtureClassA,
	nestedArrayFixtureClassB,
	nestedArrayFixtureRecipe,
} from './recipe.fixtures.css.js';

// Field and input-group recipes export from their primitive entrypoints.

test('base composes a nested class array alongside a style object', () => {
	const className = nestedArrayFixtureRecipe();
	const classes = className.split(' ');

	expect(classes).toContain(nestedArrayFixtureClassA);
	expect(classes).toContain(nestedArrayFixtureClassB);
});

test('slot functions merge an optional extra class', () => {
	expect(fieldRecipe().root('extra-class').split(' ')).toContain('extra-class');
	expect(inputGroupRecipe({ size: 'small' }).control('mine').split(' ')).toContain('mine');
});
