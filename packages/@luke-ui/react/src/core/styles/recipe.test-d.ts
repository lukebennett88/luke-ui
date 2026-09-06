/** Type-level assertions against the variant selection `recipe()` accepts. */

import { assertType, test } from 'vite-plus/test';
import { codeRecipe } from '../code/recipe.css.js';
import {
	compoundSlotsTypeFixtureRecipe,
	emptyVariantsRecipe,
	omittedVariantsRecipe,
	omittedVariantsSlottedRecipe,
	realVariantsRecipe,
	realVariantsSlottedRecipe,
} from './recipe.fixtures.css.js';
import type { recipe, RecipeComposition, RecipeSelection } from './recipe.js';

/**
 * The input type a recipe function's first parameter accepts: its variant
 * selection plus composition options such as `className`. Assigning through
 * `assertType` (rather than calling the recipe with a bad input) keeps rejection
 * cases purely type-level — a real call with a key the recipe never declared would
 * reach Vanilla Extract's runtime `recipe()` function and throw, since
 * `@ts-expect-error` only suppresses the type error, not execution.
 *
 * Every rejection assertion below stays on one line: `@ts-expect-error` only
 * covers the very next line, and wrapping the object literal across lines would
 * move the reported error onto the property line instead of the call itself.
 */
type SelectionOf<Fn> = Fn extends (selection?: infer Selection) => unknown ? Selection : never;

/** True when `Key` is not a key of `T`. Used to prove `className` never leaks into a selection. */
type Lacks<T, Key extends PropertyKey> = Key extends keyof T ? false : true;

/** True when no key of `T` can hold a value, which is how a no-variant selection rejects every key. */
type HoldsNothing<T> = [T[keyof T]] extends [never] ? true : false;

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
// className composition
// ---------------------------------------------------------------------------

test('a base-only recipe accepts className alongside nothing else', () => {
	assertType<string>(omittedVariantsRecipe({ className: 'mine' }));
	assertType<string>(omittedVariantsRecipe({ className: undefined }));
	assertType<string>(codeRecipe({ className: 'mine' }));

	// @ts-expect-error — className must be a string
	assertType<SelectionOf<typeof omittedVariantsRecipe>>({ className: 1 });
	// @ts-expect-error — an undeclared key is still rejected next to className
	assertType<SelectionOf<typeof omittedVariantsRecipe>>({ className: 'x', nonsense: true });
	// @ts-expect-error — Luke UI is React-only, so no `class` alias exists
	assertType<SelectionOf<typeof omittedVariantsRecipe>>({ class: 'x' });
});

test('a recipe with variants accepts className alongside its variants', () => {
	assertType<string>(realVariantsRecipe({ className: 'mine', size: 'small' }));
	assertType<string>(realVariantsRecipe({ className: 'mine' }));

	// @ts-expect-error — className does not loosen variant value checking
	assertType<SelectionOf<typeof realVariantsRecipe>>({ className: 'x', size: 'large' });
	// @ts-expect-error — className does not loosen undeclared-key checking
	assertType<SelectionOf<typeof realVariantsRecipe>>({ className: 'x', madeUp: true });
});

test('RecipeSelection describes only variants, never className', () => {
	type RealSelection = RecipeSelection<typeof realVariantsRecipe>;
	type NoVariantSelection = RecipeSelection<typeof omittedVariantsRecipe>;
	type CodeSelection = RecipeSelection<typeof codeRecipe>;

	assertType<Lacks<RealSelection, 'className'>>(true);
	// A no-variant selection is `Record<string, never>`: every key exists but none can hold a value.
	assertType<HoldsNothing<NoVariantSelection>>(true);
	assertType<HoldsNothing<CodeSelection>>(true);

	// Variant inference through RecipeSelection stays exact.
	assertType<RealSelection>({ size: 'medium', true: false });
	assertType<RealSelection['size']>('small');
	// @ts-expect-error — not one of the declared `size` values
	assertType<RealSelection>({ size: 'large' });
	// @ts-expect-error — a no-variant selection still rejects an arbitrary key
	assertType<NoVariantSelection>({ madeUp: 'x' });
});

test('slot functions accept only className', () => {
	const composition: RecipeComposition = { className: 'mine' };
	assertType<string>(realVariantsSlottedRecipe({ size: 'small' }).root(composition));
	assertType<string>(omittedVariantsSlottedRecipe().root({}));

	type SlotOptions = SelectionOf<ReturnType<typeof realVariantsSlottedRecipe>['root']>;
	// @ts-expect-error — a slot call takes composition options, not a bare class string
	assertType<SlotOptions>('mine');
	// @ts-expect-error — variant selection happens at the outer recipe call, not per slot
	assertType<SlotOptions>({ size: 'small' });
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

// ---------------------------------------------------------------------------
// compoundSlots
// ---------------------------------------------------------------------------

// Derive the entry type so TypeScript version changes cannot move an expected overload error.
type CompoundSlotEntry = NonNullable<
	Parameters<
		typeof recipe<'a', { size: { medium: { a: { fontWeight: 500 } } } }>
	>[0]['compoundSlots']
>[number];

/** A `compoundSlots` entry's `slots` list, as accepted by `CompoundSlotEntry`. */
type CompoundSlotNames = CompoundSlotEntry['slots'];

/** A `compoundSlots` entry's variant condition, as accepted by `CompoundSlotEntry`. */
type CompoundSlotCondition = NonNullable<CompoundSlotEntry['variants']>;

test('compoundSlots accepts a declared slot and a declared variant condition', () => {
	assertType<CompoundSlotNames>(['a']);
	assertType<CompoundSlotCondition>({ size: 'medium' });

	// A valid entry still builds a working slot function.
	assertType<string>(compoundSlotsTypeFixtureRecipe({ size: 'medium' }).a());
});

test('compoundSlots naming a slot or variant group that does not exist is a type error', () => {
	// @ts-expect-error — `z` is not a declared slot
	assertType<CompoundSlotNames>(['z']);
	// @ts-expect-error — `color` is not a declared variant group
	assertType<CompoundSlotCondition>({ color: 'red' });
	// @ts-expect-error — `large` is not a declared value of the `size` group
	assertType<CompoundSlotCondition>({ size: 'large' });
});
