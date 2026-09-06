/** Type-level assertions against the variant selection `recipe()` accepts. */

import { assertType, test } from 'vite-plus/test';
import { codeRecipe } from '../code/recipe.css.js';
import {
	emptyVariantsRecipe,
	omittedVariantsRecipe,
	omittedVariantsSlottedRecipe,
	realVariantsRecipe,
	realVariantsSlottedRecipe,
} from './recipe.fixtures.css.js';

/**
 * The selection type a recipe function's first parameter accepts. Assigning
 * through `assertType` (rather than calling the recipe with a bad selection)
 * keeps rejection cases purely type-level — a real call with a key the recipe
 * never declared would reach Vanilla Extract's runtime `recipe()` function and
 * throw, since `@ts-expect-error` only suppresses the type error, not execution.
 *
 * Every rejection assertion below stays on one line: `@ts-expect-error` only
 * covers the very next line, and wrapping the object literal across lines would
 * move the reported error onto the property line instead of the call itself.
 */
type SelectionOf<Fn> = Fn extends (selection?: infer Selection) => unknown ? Selection : never;

// ---------------------------------------------------------------------------
// Single-part, no variants
// ---------------------------------------------------------------------------

test('a no-variant recipe (variants omitted) rejects an arbitrary key', () => {
	assertType<string>(omittedVariantsRecipe());
	assertType<string>(omittedVariantsRecipe(undefined));

	assertType<SelectionOf<typeof omittedVariantsRecipe>>({});
	// @ts-expect-error — no variants were declared, so no key is accepted
	assertType<SelectionOf<typeof omittedVariantsRecipe>>({ madeUp: 'x' });
	// @ts-expect-error — an arbitrary key is rejected even when its value is undefined
	assertType<SelectionOf<typeof omittedVariantsRecipe>>({ madeUp: undefined });
});

test('a recipe authored with variants: {} rejects an arbitrary key', () => {
	assertType<string>(emptyVariantsRecipe());
	assertType<string>(emptyVariantsRecipe(undefined));

	assertType<SelectionOf<typeof emptyVariantsRecipe>>({});
	// @ts-expect-error — `variants: {}` declares no variants, so no key is accepted
	assertType<SelectionOf<typeof emptyVariantsRecipe>>({ madeUp: 'x' });
	// @ts-expect-error — an arbitrary key is rejected even when its value is undefined
	assertType<SelectionOf<typeof emptyVariantsRecipe>>({ madeUp: undefined });
});

test('codeRecipe (a real no-variant recipe) rejects an arbitrary key', () => {
	assertType<string>(codeRecipe());
	assertType<string>(codeRecipe(undefined));

	assertType<SelectionOf<typeof codeRecipe>>({});
	// @ts-expect-error — `codeRecipe` is `recipe({ base })` with no variants
	assertType<SelectionOf<typeof codeRecipe>>({ madeUp: 'x' });
	// @ts-expect-error — an arbitrary key is rejected even when its value is undefined
	assertType<SelectionOf<typeof codeRecipe>>({ madeUp: undefined });
});

// ---------------------------------------------------------------------------
// Single-part, real variants
// ---------------------------------------------------------------------------

test('a real recipe keeps its exact variant values', () => {
	assertType<string>(realVariantsRecipe({ size: 'medium' }));
	assertType<string>(realVariantsRecipe({ size: 'small' }));
	assertType<string>(realVariantsRecipe({ true: true }));
	assertType<string>(realVariantsRecipe({ true: false }));
	assertType<string>(realVariantsRecipe({ size: 'medium', true: true }));

	// @ts-expect-error — not one of the declared `size` values
	assertType<SelectionOf<typeof realVariantsRecipe>>({ size: 'large' });
	// @ts-expect-error — still rejects a key that was never declared
	assertType<SelectionOf<typeof realVariantsRecipe>>({ madeUp: 'x' });
});

// ---------------------------------------------------------------------------
// Slotted recipes
// ---------------------------------------------------------------------------

test('a slotted no-variant recipe rejects an arbitrary key', () => {
	assertType<string>(omittedVariantsSlottedRecipe().root());

	assertType<SelectionOf<typeof omittedVariantsSlottedRecipe>>({});
	// @ts-expect-error — no variants were declared, so no key is accepted
	assertType<SelectionOf<typeof omittedVariantsSlottedRecipe>>({ madeUp: 'x' });
});

test('a slotted recipe with variants accepts its real variants and rejects an arbitrary key', () => {
	assertType<string>(realVariantsSlottedRecipe({ size: 'medium' }).root());
	assertType<string>(realVariantsSlottedRecipe({ size: 'small' }).control());

	// @ts-expect-error — not one of the declared `size` values
	assertType<SelectionOf<typeof realVariantsSlottedRecipe>>({ size: 'large' });
	// @ts-expect-error — an arbitrary key is rejected even for a recipe with real variants
	assertType<SelectionOf<typeof realVariantsSlottedRecipe>>({ madeUp: 'x' });
});
