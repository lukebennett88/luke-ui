import { styleInLayer } from './layered-style.css.js';
import { recipe } from './recipe.js';

// Test-only fixtures for recipe.browser.test.ts and recipe.test-d.ts. Not exported
// from the package's public entry points, so they never reach the built
// stylesheet. `recipe()` calls a Vanilla Extract runtime that needs an active file
// scope, which only a `.css.ts` module gets from the Vanilla Extract plugin — a
// plain `.ts` (such as a `.test-d.ts`) cannot call `recipe()` at module scope, so
// every fixture recipe lives here and is imported by name instead.

export const nestedArrayFixtureClassA = styleInLayer('recipes', { color: 'rgb(1, 2, 3)' });
export const nestedArrayFixtureClassB = styleInLayer('recipes', { fontWeight: 700 });

export const nestedArrayFixtureRecipe = recipe({
	base: [[nestedArrayFixtureClassA, nestedArrayFixtureClassB], { backgroundColor: 'rgb(4, 5, 6)' }],
});

/** Single-part recipe with `variants` omitted entirely. */
export const omittedVariantsRecipe = recipe({
	base: { color: 'red' },
});

/** Single-part recipe authored with an explicit empty `variants: {}`. */
export const emptyVariantsRecipe = recipe({
	base: { color: 'blue' },
	variants: {},
});

/** Single-part recipe with real variants, including a boolean-mapped one. */
export const realVariantsRecipe = recipe({
	base: { color: 'green' },
	variants: {
		size: {
			medium: { fontSize: '1rem' },
			small: { fontSize: '0.8rem' },
		},
		true: {
			false: { opacity: 0.5 },
			true: { opacity: 1 },
		},
	},
});

/** Slotted recipe with `variants` omitted entirely. */
export const omittedVariantsSlottedRecipe = recipe({
	slots: {
		root: { display: 'block' },
	},
});

/** Slotted recipe with real variants. */
export const realVariantsSlottedRecipe = recipe({
	slots: {
		control: { padding: '0.5rem' },
		root: { display: 'flex' },
	},
	variants: {
		size: {
			medium: { root: { blockSize: '2.5rem' } },
			small: { root: { blockSize: '2rem' } },
		},
	},
});
