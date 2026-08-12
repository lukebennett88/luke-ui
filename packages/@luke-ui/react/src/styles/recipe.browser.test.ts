import { expect, test } from 'vite-plus/test';
import { fieldRecipe } from '../primitives/field/recipe.css.js';
import { inputGroupRecipe } from '../primitives/input-group/recipe.css.js';
import {
	nestedArrayFixtureClassA,
	nestedArrayFixtureClassB,
	nestedArrayFixtureRecipe,
} from './recipe.fixtures.css.js';

// Field and input-group recipes export from their primitive entrypoints.

test('field selects variants at the outer call and returns slot functions', () => {
	const slots = fieldRecipe({ necessityIndicator: 'icon', tone: 'error' });

	expect(typeof slots.root()).toBe('string');
	expect(typeof slots.label()).toBe('string');
	expect(typeof slots.message()).toBe('string');
});

test('base composes a nested class array alongside a style object', () => {
	const className = nestedArrayFixtureRecipe();
	const classes = className.split(' ');

	expect(classes).toContain(nestedArrayFixtureClassA);
	expect(classes).toContain(nestedArrayFixtureClassB);

	const element = document.body.appendChild(document.createElement('div'));
	element.className = className;
	const style = getComputedStyle(element);

	// The fixture paints concrete colours so we can prove the style object landed; the values
	// themselves are not a public contract.
	expect(style.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
	expect(style.color).not.toBe('rgba(0, 0, 0, 0)');
	expect(style.fontWeight).toBe('700');

	element.remove();
});

test('slot functions merge an optional extra class', () => {
	expect(fieldRecipe().root('extra-class').split(' ')).toContain('extra-class');
	expect(inputGroupRecipe({ size: 'small' }).control('mine').split(' ')).toContain('mine');
});
