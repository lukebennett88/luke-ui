/**
 * Resolves to `true` only when `A` and `B` have exactly the same members in both
 * directions, and `false` otherwise — a plain mutual `extends` isn't enough here
 * because it can pass by accident for `any`/`never`. Pair with `AssertTrue` to turn a
 * drift between two types into a compile error.
 */
export type TypesAreEqual<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/**
 * Forces a compile error unless `T` is exactly `true`. Purely a type-level check — it
 * has no runtime representation, so using it costs nothing in the built output.
 */
export type AssertTrue<T extends true> = T;
