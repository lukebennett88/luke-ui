import { styleInLayer } from './layered-style.css.js';
import { recipe } from './recipe.js';

// Test-only fixture for recipe.browser.test.ts. Not exported from the package's
// public entry points, so it never reaches the built stylesheet.

export const nestedArrayFixtureClassA = styleInLayer('recipes', { color: 'rgb(1, 2, 3)' });
export const nestedArrayFixtureClassB = styleInLayer('recipes', { fontWeight: 700 });

export const nestedArrayFixtureRecipe = recipe({
	base: [[nestedArrayFixtureClassA, nestedArrayFixtureClassB], { backgroundColor: 'rgb(4, 5, 6)' }],
});
