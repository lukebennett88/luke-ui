import { style } from './layered-style.css.js';
import { recipe, withDefaultVariants } from './recipe.js';

// Test-only fixtures. They live in `.css.ts` because `recipe()` needs a Vanilla Extract file scope.

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

export const defaultedVariantsRecipe = withDefaultVariants(realVariantsRecipe, {
	size: 'medium',
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
		// Unconditional: overrides the base colour on `a` and `b`, and leaves `c` alone.
		{ slots: ['a', 'b'], style: { color: 'rgb(100, 100, 100)' } },
		// Second unconditional entry on `a` only, to prove declaration order.
		{ slots: ['a'], style: { color: 'rgb(110, 110, 110)' } },
		// Conditional on a group (`tone`) that none of these slots otherwise use.
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

/** A pre-built class. Slotted recipes cannot reorder it; a single-part recipe can still use it. */
export const prebuiltVariantClass = style({ color: 'rgb(41, 41, 41)' });

/** A single-part recipe with a pre-built class as a variant style. */
export const prebuiltClassSinglePartRecipe = recipe({
	base: { color: 'rgb(40, 40, 40)' },
	variants: {
		emphasis: { strong: prebuiltVariantClass },
	},
});

/** A slot variant beats unconditional `compoundSlots` and loses to conditional ones. */
export const slotVariantPrecedenceRecipe = recipe({
	slots: { root: { color: 'rgb(40, 40, 40)' } },
	variants: {
		emphasis: { strong: { root: { color: 'rgb(41, 41, 41)' } } },
		tone: { accent: {}, neutral: {} },
	},
	compoundSlots: [
		{ slots: ['root'], style: { color: 'rgb(42, 42, 42)' } },
		{ slots: ['root'], style: { color: 'rgb(43, 43, 43)' }, variants: { tone: 'accent' } },
	],
});

/** Untargeted slots keep the same precedence as targeted ones. */
export const untargetedSlotPrecedenceRecipe = recipe({
	slots: {
		targeted: { color: 'rgb(50, 50, 50)' },
		untargeted: { color: 'rgb(50, 50, 50)' },
	},
	variants: {
		emphasis: {
			strong: {
				targeted: { color: 'rgb(51, 51, 51)' },
				untargeted: { color: 'rgb(51, 51, 51)' },
			},
		},
		tone: { accent: {}, neutral: {} },
	},
	compoundSlots: [
		{ slots: ['targeted'], style: { fontWeight: 600 } },
		{ slots: ['targeted'], style: { color: 'rgb(52, 52, 52)' }, variants: { tone: 'accent' } },
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
