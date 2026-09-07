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

/**
 * A pre-built class declared above the recipes that reference it, so its CSS source
 * position is fixed before any `recipe()` below emits anything.
 *
 * A slotted recipe cannot move that position into the `compoundSlots` precedence order,
 * so `SlottedStyleRule` rejects this form; `recipe.test-d.ts` proves the rejection, and
 * `prebuiltClassSinglePartRecipe` below proves single-part recipes still accept it.
 */
export const prebuiltVariantClass = style({ color: 'rgb(41, 41, 41)' });

/**
 * Single-part recipe composing a pre-built class as a variant style. Single-part recipes
 * reorder nothing, so this stays supported.
 */
export const prebuiltClassSinglePartRecipe = recipe({
	base: { color: 'rgb(40, 40, 40)' },
	variants: {
		emphasis: { strong: prebuiltVariantClass },
	},
});

/**
 * The style-object equivalent of the rejected pre-built-class case: a slot variant that
 * `recipe()` emits itself keeps the documented precedence, outranking an unconditional
 * `compoundSlots` entry and losing to a conditional one.
 */
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

/**
 * A slot no `compoundSlots` entry names must still follow the documented precedence.
 *
 * `targeted` is named by both entries, `untargeted` by neither. Both slots declare an
 * `emphasis` variant setting `color`, which the conditional shared style also sets, so the
 * relative CSS source position of a slot variant and the conditional shared style decides the
 * resolved colour. The documented order puts every slot variant ahead of every conditional
 * shared style regardless of which slot owns it, so composing `untargeted`'s classes with the
 * shared conditional class must resolve the same way `targeted` does.
 */
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
