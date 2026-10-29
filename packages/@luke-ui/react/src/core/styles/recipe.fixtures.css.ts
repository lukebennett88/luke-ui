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

/** Two slots with a variant each, to pin the order slotted CSS is emitted in. */
export const slottedPrecedenceRecipe = recipe({
	slots: { first: { color: 'rgb(10, 10, 10)' }, second: { color: 'rgb(20, 20, 20)' } },
	variants: {
		emphasis: {
			strong: { first: { color: 'rgb(11, 11, 11)' }, second: { color: 'rgb(21, 21, 21)' } },
		},
	},
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
