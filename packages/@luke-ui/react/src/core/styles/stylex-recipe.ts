import type { CompiledStyles } from '@stylexjs/stylex';
import * as stylex from '@stylexjs/stylex';

/** A compiled StyleX style returned by a `stylex.create(...)` entry. */
type StyleXStyle = CompiledStyles;

/**
 * A single variant value's compiled style, or `null` for a variant value that is valid but
 * contributes no style of its own (the old Vanilla Extract engine's no-op `{}` entries). `null` is
 * a real selectable value, distinct from an unselected group — resolution skips it the same way it
 * skips an absent style, but its presence in a variant map keeps the value in the public union.
 * Never use `undefined` for this meaning: `undefined` already means "this group was not selected".
 */
type VariantValue = StyleXStyle | null;

/**
 * One or more compiled styles, applied together as an unconditional base.
 *
 * A `base` array is spread exactly one level — it is not flattened recursively. The predecessor
 * Vanilla Extract engine did flatten nested arrays; this one deliberately does not, because every
 * call site passes a flat list and `stylex.props` takes its arguments flat anyway. Keep the array
 * flat rather than reintroducing recursion.
 */
type StyleXStyleList = StyleXStyle | ReadonlyArray<StyleXStyle>;

/** Maps the string variant keys `'true'`/`'false'` onto `boolean` for selection. */
type BooleanMap<T> = T extends 'true' | 'false' ? boolean : T;

/** Variant groups for a single-part recipe: group name to value name to compiled style. */
type VariantGroups = Record<string, Record<string, VariantValue>>;

/**
 * The variant map of a recipe that declares no `variants` at all.
 *
 * Every factory below defaults its `Variants` type parameter to this. `variants` is optional in
 * both configs, so a base-only recipe gives inference no site to read `Variants` from; without a
 * default, TypeScript falls back to the *constraint* (`Record<string, Record<string,
 * VariantValue>>`) and the resulting selection accepts arbitrary keys — `codeRecipe({ size:
 * 'small' })` would silently type-check.
 *
 * The groups are keyed by `string` on purpose, and each group has no values. That makes the mapped
 * selection `{ [group: string]?: never }`, so *any* key is rejected while a bare `resolver()` or
 * `codeRecipe()` (and an empty `{}` selection) stays valid. An empty object type (`{}`, or its
 * spelling `Record<never, never>`) does not work here: a target type with no properties at all
 * triggers neither excess-property nor weak-type checking, so `codeRecipe({ size: 'small' })`
 * would still compile.
 */
type NoVariants = Record<string, Record<never, never>>;

/** Outer selection for a single-part recipe. */
type VariantSelection<Variants extends VariantGroups> = {
	-readonly [Group in keyof Variants]?: BooleanMap<keyof Variants[Group]> | undefined;
};

/** A compound variant for a single-part recipe. */
interface CompoundVariant<Variants extends VariantGroups> {
	style: StyleXStyle;
	variants: VariantSelection<Variants>;
}

/** Single-part recipe config. */
interface SinglePartConfig<Variants extends VariantGroups> {
	base?: StyleXStyleList;
	compoundVariants?: Array<CompoundVariant<Variants>>;
	defaultVariants?: VariantSelection<Variants>;
	variants?: Variants;
}

/** The canonical resolver for a single-part recipe: selection in, ordered compiled styles out. */
type SinglePartResolver<Variants extends VariantGroups> = (
	selection?: VariantSelection<Variants>,
) => Array<StyleXStyle>;

/** A per-slot style map: slot name to a variant value for that slot. Unaffected slots are omitted — a partial slot map is not padded with `null` entries for the slots it does not style. */
type SlotStyles<Slot extends string> = Partial<Record<Slot, VariantValue>>;

/**
 * Variant groups for a slotted recipe: group to value to per-slot styles. A value may be `null` —
 * the same meaning as in a single-part recipe: a valid variant value that contributes no style,
 * rather than a fake empty style object.
 */
type SlotVariantGroups<Slot extends string> = Record<
	string,
	Record<string, SlotStyles<Slot> | null>
>;

/** Outer selection for a slotted recipe. */
type SlotVariantSelection<Variants extends SlotVariantGroups<string>> = {
	-readonly [Group in keyof Variants]?: BooleanMap<keyof Variants[Group]> | undefined;
};

/** Slotted recipe config. */
interface MultiPartConfig<Slot extends string, Variants extends SlotVariantGroups<Slot>> {
	defaultVariants?: SlotVariantSelection<Variants>;
	slots: Record<Slot, StyleXStyleList>;
	variants?: Variants;
}

/**
 * The canonical resolver object for a slotted recipe: `slotNames` is the fixed anatomy (so an
 * adapter built on top never has to re-list slot names), and `resolveSlotStyles` is the one
 * per-slot resolution operation everything else composes from.
 */
interface SlottedRecipeStyles<Slot extends string, Variants extends SlotVariantGroups<Slot>> {
	resolveSlotStyles: (
		slotName: Slot,
		selection?: SlotVariantSelection<Variants>,
	) => Array<StyleXStyle>;
	slotNames: ReadonlyArray<Slot>;
}

/** Derives the outer variant selection type for a single-part recipe from its canonical resolver. */
export type RecipeSelection<Fn> = Fn extends (selection?: infer Selection) => unknown
	? NonNullable<Selection>
	: never;

/**
 * Derives the outer variant selection type for a slotted recipe from its canonical
 * `resolveSlotStyles` resolver, whose selection is the second parameter (after the slot name). A
 * single, structural `RecipeSelection<Fn>` cannot cover both shapes: a one-parameter resolver is
 * itself assignable to a two-parameter function type, so a shared conditional would silently widen
 * a single-part resolver's selection to `{}` instead of failing to match.
 */
export type SlotRecipeSelection<Fn> = Fn extends (
	slotName: never,
	selection?: infer Selection,
) => unknown
	? NonNullable<Selection>
	: never;

/** The full `stylex.props(...)` output — spreadable element props — that a public recipe returns. */
export type RecipeProps = ReturnType<typeof stylex.props>;

/**
 * Builds the canonical resolver for a single-part recipe: selection in, the ordered list of
 * compiled styles it resolves to out. Owns default variants, simple variant selection, compound
 * variants, and their relative ordering (base, then simple variants in config order, then matching
 * compound variants) — the same resolution algorithm the predecessor tuple-returning factory used.
 *
 * A component composes this resolver's output into its own `stylex.props` call (see
 * `resolveXStyleProps` in `xstyle.ts`) before its public `xstyle` value, so a component rendering
 * one recipe never pays to also format that recipe as class-name/style props it will not use.
 * `createRecipe` below adapts this same resolver into that formatted, public-facing shape.
 */
export function createRecipeStyles<const Variants extends VariantGroups = NoVariants>(
	config: SinglePartConfig<Variants>,
): SinglePartResolver<Variants> {
	return function resolveStyles(selection?: VariantSelection<Variants>): Array<StyleXStyle> {
		const selected = mergeSelection(config.defaultVariants, selection);
		return resolveSinglePartStyles(config.base, config.variants, config.compoundVariants, selected);
	};
}

/**
 * Adapts a single-part canonical resolver into a public recipe: a function that takes the same
 * selection and returns the full `stylex.props(...)` output (spreadable element props), not a bare
 * class string. It preserves the resolver's own selection parameter, so `buttonRecipe({ size:
 * 'small' })` still type-checks against the resolver's variant groups.
 */
export function createRecipe<const Variants extends VariantGroups = NoVariants>(
	resolver: SinglePartResolver<Variants>,
): (selection?: VariantSelection<Variants>) => RecipeProps {
	return (selection) => stylex.props(...resolver(selection));
}

/**
 * Builds the canonical resolver for a slotted recipe around one operation, `resolveSlotStyles`, so
 * a component that renders a single slot — a repeated `ComboboxItem` among Combobox's seventeen —
 * never pays to resolve the other sixteen. `slotNames` travels alongside it so `createSlottedRecipe`
 * can build one function per slot without a caller re-listing the recipe's own anatomy.
 */
export function createSlottedRecipeStyles<
	const Slot extends string,
	const Variants extends SlotVariantGroups<Slot> = NoVariants,
>(config: MultiPartConfig<Slot, Variants>): SlottedRecipeStyles<Slot, Variants> {
	const slotNames = Object.keys(config.slots) as Array<Slot>;

	function resolveSlotStyles(
		slotName: Slot,
		selection?: SlotVariantSelection<Variants>,
	): Array<StyleXStyle> {
		const selected = mergeSelection(config.defaultVariants, selection);
		return resolveSinglePartStyles(
			config.slots[slotName],
			resolveSlotVariants(slotName, config.variants),
			undefined,
			selected,
		);
	}

	return { resolveSlotStyles, slotNames };
}

/**
 * Adapts a slotted canonical resolver into a public recipe: a function that takes the outer
 * selection and returns one `stylex.props(...)` result per slot. Reads its anatomy from
 * `slotNames` on the resolver object, so a caller never re-lists the slot names the resolver
 * config already declared.
 *
 * Each slot is defined as a lazy getter, not resolved eagerly: a component that renders a single
 * slot — a repeated `ComboboxItem` among Combobox's seventeen — still never pays to format the
 * other sixteen as `stylex.props(...)` output, matching the canonical resolver's own laziness.
 */
export function createSlottedRecipe<
	const Slot extends string,
	const Variants extends SlotVariantGroups<Slot> = NoVariants,
>(
	recipeStyles: SlottedRecipeStyles<Slot, Variants>,
): (selection?: SlotVariantSelection<Variants>) => Record<Slot, RecipeProps> {
	return (selection) => {
		const slots = {} as Record<Slot, RecipeProps>;

		for (const slotName of recipeStyles.slotNames) {
			Object.defineProperty(slots, slotName, {
				enumerable: true,
				get: () => stylex.props(...recipeStyles.resolveSlotStyles(slotName, selection)),
			});
		}

		return slots;
	};
}

function resolveSlotVariants<Slot extends string>(
	slotName: Slot,
	variantGroups: SlotVariantGroups<Slot> | undefined,
): VariantGroups | undefined {
	if (variantGroups === undefined) return undefined;

	const resolved: VariantGroups = {};
	for (const [group, values] of Object.entries(variantGroups)) {
		const perValue: Record<string, VariantValue> = {};

		for (const [value, slotStyles] of Object.entries(values)) {
			// A whole variant value may be `null`: valid, styles no slot at all.
			if (slotStyles === null) {
				perValue[value] = null;
				continue;
			}

			// A partial slot map omits the slots a variant value does not style — that omission
			// (`undefined`) is different from styling a slot with `null` (a real, no-op value), so
			// only `undefined` is filtered out here.
			const style = slotStyles[slotName];
			if (style !== undefined) perValue[value] = style;
		}

		if (Object.keys(perValue).length > 0) resolved[group] = perValue;
	}

	return resolved;
}

function mergeSelection(
	defaultVariants: Record<string, unknown> | undefined,
	selection: Record<string, unknown> | undefined,
): Record<string, unknown> {
	const merged: Record<string, unknown> = { ...defaultVariants };
	if (selection === undefined) return merged;

	for (const [group, value] of Object.entries(selection)) {
		if (value !== undefined) merged[group] = value;
	}
	return merged;
}

function resolveSinglePartStyles<Variants extends VariantGroups>(
	base: StyleXStyleList | undefined,
	variants: Variants | undefined,
	compoundVariants: Array<CompoundVariant<Variants>> | undefined,
	selected: Record<string, unknown>,
): Array<StyleXStyle> {
	const styles: Array<StyleXStyle> = [];
	if (base !== undefined) styles.push(...(Array.isArray(base) ? base : [base]));

	if (variants !== undefined) {
		for (const [group, values] of Object.entries(variants)) {
			const chosen = selected[group];
			if (chosen === undefined) continue;
			const style = values[toVariantKey(chosen)];
			// `null` is a valid variant value that contributes no style — resolution skips it, the
			// same way it skips an absent style, without ever pushing it into the styles array
			// `stylex.props` receives.
			if (style !== undefined && style !== null) styles.push(style);
		}
	}

	if (compoundVariants !== undefined) {
		for (const compound of compoundVariants) {
			const matches = Object.entries(compound.variants).every(
				([group, value]) => toVariantKey(selected[group]) === toVariantKey(value),
			);
			if (matches) styles.push(compound.style);
		}
	}

	return styles;
}

/** Variant selections arrive as real booleans but are keyed as `'true'`/`'false'`. */
function toVariantKey(value: unknown): string {
	return String(value);
}
