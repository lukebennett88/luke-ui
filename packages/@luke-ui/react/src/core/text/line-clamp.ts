import type { TextRecipeVariants } from './recipe.css.js';

/**
 * Reads the `lineClamp` value space out of `textRecipe` and answers which of its values let the
 * text wrap onto more than one line.
 *
 * This lives outside `recipe.css.ts` because a Vanilla Extract `.css.ts` module may only export
 * serializable values, so it cannot export the predicate below for a composing component to call
 * at runtime.
 */

/** A `lineClamp` value as `Text` accepts it. */
type LineClampValue = NonNullable<NonNullable<TextRecipeVariants>['lineClamp']>;

/**
 * The `lineClamp` values that clamp to a single line. Every other value clamps to more, so adding
 * a clamp step needs no change here; removing `true` or `1` from the recipe makes this a type
 * error rather than leaving it stale.
 */
const singleLineClampValues = [true, 1] as const satisfies ReadonlyArray<LineClampValue>;

/**
 * True when `lineClamp` clamps to more than one line, so the text is allowed to wrap.
 *
 * A component that layers its own wrapping rule over `Text` reads this instead of restating which
 * clamp values wrap. Which of a single-line clamp and `textWrap` wins is settled inside
 * `textRecipe` by declaration order, so this only answers whether a clamp wants to wrap at all.
 */
export function isWrappingLineClamp(lineClamp: LineClampValue | undefined): boolean {
	if (lineClamp === undefined || lineClamp === false) return false;
	return !(singleLineClampValues as ReadonlyArray<LineClampValue>).includes(lineClamp);
}
