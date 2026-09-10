/**
 * Public recipe selection types. Kept free of styling-engine imports so consumer
 * declarations do not resolve Vanilla Extract solely for type checking.
 */

/** An optional consumer `className`. Not a variant. */
export interface RecipeComposition {
	className?: string;
}

/** Variant keys of a built recipe. Omits `className`. Empty recipes → `Record<string, never>`. */
export type RecipeSelection<Fn> = Fn extends (input?: infer Input) => unknown
	? VariantKeysOf<NonNullable<Input>>
	: never;

type VariantKeysOf<Input> = [Exclude<keyof Input, keyof RecipeComposition>] extends [never]
	? Record<string, never>
	: Omit<Input, keyof RecipeComposition>;
