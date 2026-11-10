import type { CompiledStyles, InlineStyles, StyleXArray } from '@stylexjs/stylex';

/** Anything `stylex.props` accepts: compiled styles, falsy values, and nested arrays of them. */
export type StyleInput = StyleXArray<
	null | undefined | CompiledStyles | boolean | Readonly<[CompiledStyles, InlineStyles]>
>;
type VariantGroups = Record<string, Record<string, StyleInput>>;
// Variant keys are object keys, so `true` and `2` arrive as `'true'` and `'2'`. Accept both forms.
type Key<T> = T extends 'true' | 'false'
	? boolean | T
	: T extends `${infer N extends number}`
		? N | T
		: T;
type Selection<V extends VariantGroups> = { [K in keyof V]?: Key<keyof V[K] & string> };

type RecipeConfig<V extends VariantGroups> = {
	base?: StyleInput;
	variants: V;
	defaultVariants: { [K in keyof V]: keyof V[K] };
	compoundVariants?: ReadonlyArray<{ variants: Selection<V>; style: StyleInput }>;
};

/** The variant selection a recipe accepts. */
export type RecipeSelection<R> = R extends (selection: infer S) => unknown ? NonNullable<S> : never;

/**
 * A thin runtime over styles that `stylex.create` already compiled. It returns the styles to pass to
 * `stylex.props` in application order: base, each variant group in declaration order, then every
 * matching compound. StyleX resolves a property set by more than one of them by that order, at
 * runtime, so precedence between variants never depends on stylesheet order.
 */
export function recipe<const V extends VariantGroups>(config: RecipeConfig<V>) {
	const groups = Object.keys(config.variants) as Array<keyof V & string>;
	return (selection: Selection<V> = {}): ReadonlyArray<StyleInput> => {
		const resolved = { ...config.defaultVariants } as { [K in keyof V]: keyof V[K] };
		for (const group of groups) {
			const value = selection[group];
			if (value !== undefined) resolved[group] = String(value) as keyof V[typeof group];
		}
		const styles: Array<StyleInput> = [config.base];
		for (const group of groups) {
			styles.push(config.variants[group]?.[resolved[group] as string]);
		}
		for (const compound of config.compoundVariants ?? []) {
			const matches = Object.entries(compound.variants).every(([group, value]) => {
				return String(resolved[group]) === String(value);
			});
			if (matches) styles.push(compound.style);
		}
		return styles;
	};
}
