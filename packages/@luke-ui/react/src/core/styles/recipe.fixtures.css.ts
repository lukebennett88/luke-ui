import { style } from './layered-style.css.js';
import { recipe } from './recipe.js';

// Test-only fixtures for recipe.browser.test.ts and recipe.test-d.ts. Not exported
// from the package's public entry points, so they never reach the built
// stylesheet. `recipe()` calls a Vanilla Extract runtime that needs an active file
// scope, which only a `.css.ts` module gets from the Vanilla Extract plugin — a
// plain `.ts` (such as a `.test-d.ts`) cannot call `recipe()` at module scope, so
// every fixture recipe lives here and is imported by name instead.

export const nestedArrayFixtureClassA = style({ color: 'rgb(1, 2, 3)' });
export const nestedArrayFixtureClassB = style({ fontWeight: 700 });

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

/** Covers shared, conditional, and ordered `compoundSlots` entries. */
export const compoundSlotsRecipe = recipe({
	slots: {
		a: { color: 'rgb(10, 10, 10)' },
		b: { color: 'rgb(20, 20, 20)' },
		c: { color: 'rgb(30, 30, 30)' },
	},
	variants: {
		size: {
			medium: { a: { fontWeight: 500 } },
			small: { a: { fontWeight: 400 } },
		},
		tone: {
			accent: {},
			neutral: {},
		},
	},
	compoundSlots: [
		// Unconditional: overrides `a` and `b`'s base color, leaves `c` alone.
		{ slots: ['a', 'b'], style: { color: 'rgb(100, 100, 100)' } },
		// Second unconditional entry on `a` only, to prove declaration order.
		{ slots: ['a'], style: { color: 'rgb(110, 110, 110)' } },
		// Conditional on a group (`tone`) none of these slots otherwise use.
		{
			slots: ['a', 'b'],
			style: { backgroundColor: 'rgb(200, 200, 200)' },
			variants: { tone: 'accent' },
		},
		// `b` and `c` use `size` only through this compound entry.
		{
			slots: ['a', 'b', 'c'],
			style: { fontWeight: 700 },
			variants: { size: 'medium' },
		},
	],
});

/** Valid fixture used to derive the `compoundSlots` entry type in `recipe.test-d.ts`. */
export const compoundSlotsTypeFixtureRecipe = recipe({
	slots: {
		a: { color: 'rgb(1, 1, 1)' },
	},
	variants: {
		size: {
			medium: { a: { fontWeight: 500 } },
		},
	},
	compoundSlots: [{ slots: ['a'], style: { color: 'rgb(3, 3, 3)' }, variants: { size: 'medium' } }],
});

export const compoundSlotsPrecedenceRecipe = recipe({
	slots: { root: { color: 'rgb(1, 1, 1)', fontWeight: 300 } },
	variants: {
		appearance: { solid: { root: { color: 'rgb(2, 2, 2)' } } },
		size: { medium: { root: { fontWeight: 400 } } },
		tone: { accent: {}, neutral: {} },
	},
	compoundSlots: [
		{ slots: ['root'], style: { fontWeight: 500 }, variants: { size: 'medium', tone: 'accent' } },
		{ slots: ['root'], style: { fontWeight: 350 } },
		{ slots: ['root'], style: { color: 'rgb(3, 3, 3)' }, variants: { tone: 'accent' } },
	],
});

export const conditionalSlotsBaseRecipe = recipe({
	slots: { root: { color: 'rgb(1, 1, 1)' } },
	variants: { tone: { accent: {} } },
	compoundSlots: [
		{ slots: ['root'], style: { color: 'rgb(2, 2, 2)' }, variants: { tone: 'accent' } },
	],
});

export const compoundSlotsOrderRecipe = recipe({
	slots: { first: {}, second: {} },
	variants: { tone: { accent: {} } },
	compoundSlots: [
		{ slots: ['second'], style: { fontWeight: 400 } },
		{ slots: ['first', 'second'], style: { fontWeight: 500 }, variants: {} },
		{ slots: ['second'], style: { color: 'rgb(1, 1, 1)' }, variants: { tone: 'accent' } },
		{ slots: ['first', 'second'], style: { color: 'rgb(2, 2, 2)' }, variants: { tone: 'accent' } },
	],
});
