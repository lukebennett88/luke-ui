import { expect, test } from 'vite-plus/test';
import { fieldRecipe } from '../primitives/field/recipe.css.js';
import { inputGroupRecipe } from '../primitives/input-group/recipe.css.js';
import {
	nestedArrayFixtureClassA,
	nestedArrayFixtureClassB,
	nestedArrayFixtureRecipe,
	omittedVariantsRecipe,
	realVariantsRecipe,
} from './recipe.fixtures.css.js';

// Field and input-group recipes export from their primitive entrypoints.

test('base composes a nested class array alongside a style object', () => {
	const className = nestedArrayFixtureRecipe();
	const classes = className.split(' ');

	expect(classes).toContain(nestedArrayFixtureClassA);
	expect(classes).toContain(nestedArrayFixtureClassB);
});

test('a single-part recipe appends a consumer className after its own classes', () => {
	const own = realVariantsRecipe({ size: 'small' });
	const composed = realVariantsRecipe({ className: 'mine', size: 'small' });

	expect(composed).toBe(`${own} mine`);
});

test('a single-part recipe returns only its own classes when className is omitted', () => {
	const withoutKey = realVariantsRecipe({ size: 'small' });
	const undefinedKey = realVariantsRecipe({ className: undefined, size: 'small' });
	const bare = realVariantsRecipe();

	expect(undefinedKey).toBe(withoutKey);
	expect(bare.split(' ')).not.toContain('undefined');
	expect(bare.endsWith(' ')).toBe(false);
});

test('a base-only recipe composes a consumer className', () => {
	const own = omittedVariantsRecipe();

	expect(omittedVariantsRecipe({ className: 'mine' })).toBe(`${own} mine`);
	expect(omittedVariantsRecipe({})).toBe(own);
});

test('slot functions append a consumer className', () => {
	const ownRoot = fieldRecipe().root();
	const ownControl = inputGroupRecipe({ size: 'small' }).control();

	expect(fieldRecipe().root({ className: 'extra-class' })).toBe(`${ownRoot} extra-class`);
	expect(inputGroupRecipe({ size: 'small' }).control({ className: 'mine' })).toBe(
		`${ownControl} mine`,
	);
	expect(fieldRecipe().root({})).toBe(ownRoot);
});
