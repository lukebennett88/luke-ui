import type { CompiledStyles } from '@stylexjs/stylex';
import * as stylex from '@stylexjs/stylex';

/** A compiled StyleX style returned by a `stylex.create(...)` entry. */
type StyleXStyle = CompiledStyles;

/** A compiled style, or `null` for a valid variant value with no styles. */
type VariantValue = StyleXStyle | null;

/** One or more compiled styles applied as an unconditional base. Base arrays are one level deep. */
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
 * This is an empty object type (`Record<never, never>`), not a string-indexed map. The empty case
 * is handled in `VariantSelection` / `SlotVariantSelection` themselves: when `keyof Variants` is
 * `never` — whether from this default or from an authored `variants: {}` — the selection becomes
 * `Record<string, never>`, which rejects every key (including `undefined` values) while still
 * accepting a bare call or `{}`.
 */
type NoVariants = Record<never, never>;

/**
 * Outer selection for a single-part recipe.
 *
 * When `Variants` has no groups (`keyof Variants` is `never`), the selection is
 * `Record<string, never>` rather than a mapped type over zero keys. A mapped type over an empty
 * object collapses to `{}`, and TypeScript does not reject arbitrary keys against that target; an
 * optional mapped property over a string index (`{ [key: string]?: never }`) still accepts
 * `{ madeUp: undefined }`. `Record<string, never>` closes both holes for omitted `variants` and
 * for an authored `variants: {}`.
 */
type VariantSelection<Variants extends VariantGroups> = [keyof Variants] extends [never]
	? Record<string, never>
	: {
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

/** Maps slot names to styles. Unaffected slots are omitted. */
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

/**
 * Outer selection for a slotted recipe. Same empty-map rule as `VariantSelection`: no groups means
 * `Record<string, never>`, so neither omitted `variants` nor an authored `variants: {}` accepts a
 * fake key.
 */
type SlotVariantSelection<Variants extends SlotVariantGroups<string>> = [keyof Variants] extends [
	never,
]
	? Record<string, never>
	: {
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

/** Derives the outer selection type from a slotted resolver's second parameter. */
export type SlotRecipeSelection<Fn> = Fn extends (
	slotName: never,
	selection?: infer Selection,
) => unknown
	? NonNullable<Selection>
	: never;

/** The spreadable `stylex.props(...)` output returned by a public recipe. */
export type RecipeProps = ReturnType<typeof stylex.props>;

/** Resolves a single-part recipe to an ordered list of compiled styles. */
export function createRecipeStyles<const Variants extends VariantGroups = NoVariants>(
	config: SinglePartConfig<Variants>,
): SinglePartResolver<Variants> {
	return function resolveStyles(selection?: VariantSelection<Variants>): Array<StyleXStyle> {
		const selected = mergeSelection(config.defaultVariants, selection);
		return resolveSinglePartStyles(config.base, config.variants, config.compoundVariants, selected);
	};
}

/** Adapts a single-part resolver into a public recipe. */
export function createRecipe<const Variants extends VariantGroups = NoVariants>(
	resolver: SinglePartResolver<Variants>,
): (selection?: VariantSelection<Variants>) => RecipeProps {
	return (selection) => stylex.props(...resolver(selection));
}

/** Builds a resolver for a slotted recipe and records its slot names. */
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

/** Adapts a slotted resolver into a public recipe with lazy per-slot props. */
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
			// `null` is valid and styles no slot.
			if (slotStyles === null) {
				perValue[value] = null;
				continue;
			}

			// Omitted slots are `undefined`; `null` is a valid no-op value.
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
			// `null` is a valid variant value with no style.
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
