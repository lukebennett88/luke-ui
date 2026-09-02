import type { CompiledStyles } from '@stylexjs/stylex';
import * as stylex from '@stylexjs/stylex';
import { cx } from '../../shared/utils/utils.js';

/** A compiled StyleX style returned by a `stylex.create(...)` entry. */
type StyleXStyle = CompiledStyles;

/** One or more compiled styles, applied together as an unconditional base. */
type StyleXStyleList = StyleXStyle | ReadonlyArray<StyleXStyle>;

/** Maps the string variant keys `'true'`/`'false'` onto `boolean` for selection. */
type BooleanMap<T> = T extends 'true' | 'false' ? boolean : T;

/** Variant groups for a single-part recipe: group name to value name to compiled style. */
type VariantGroups = Record<string, Record<string, StyleXStyle>>;

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

/** The public string-returning function for a single-part recipe. */
type SinglePartRecipe<Variants extends VariantGroups> = (
	selection?: VariantSelection<Variants>,
) => string;

/** A per-slot style map: slot name to compiled style(s) for that slot. */
type SlotStyles<Slot extends string> = Partial<Record<Slot, StyleXStyle>>;

/** Variant groups for a slotted recipe: group to value to per-slot styles. */
type SlotVariantGroups<Slot extends string> = Record<string, Record<string, SlotStyles<Slot>>>;

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

/** A single slot function: takes an optional extra class and returns a class string. */
type SlotFn = (extraClass?: string) => string;

/** The public string-returning function for a slotted recipe. */
type MultiPartRecipe<Slot extends string, Variants extends SlotVariantGroups<Slot>> = (
	selection?: SlotVariantSelection<Variants>,
) => Record<Slot, SlotFn>;

/** Derives the outer variant selection type for a built recipe. */
export type RecipeSelection<Fn> = Fn extends (selection?: infer Selection) => unknown
	? NonNullable<Selection>
	: never;

/**
 * Builds a single-part recipe as two deliberately separate internal views. The first tuple element
 * keeps the public string API; the second, `resolveStyles`, is package-private composition input
 * for a component to pass into `stylex.props` before its public `xstyle` value.
 */
export function createSingleRecipe<const Variants extends VariantGroups>(
	config: SinglePartConfig<Variants>,
): readonly [
	recipe: SinglePartRecipe<Variants>,
	resolveStyles: (selection?: VariantSelection<Variants>) => Array<StyleXStyle>,
] {
	function resolveStyles(selection?: VariantSelection<Variants>): Array<StyleXStyle> {
		const selected = mergeSelection(config.defaultVariants, selection);
		return resolveSinglePartStyles(config.base, config.variants, config.compoundVariants, selected);
	}

	return [(selection) => resolveClassName(resolveStyles(selection)), resolveStyles];
}

/**
 * Builds a slotted recipe around one canonical per-slot resolution operation
 * (`resolveSlotStyles`), so a component that renders a single slot — a repeated `ComboboxItem`
 * among Combobox's seventeen — never pays to resolve the other sixteen. The two tuple elements are
 * both thin views over that same operation, not a second algorithm: the first, `recipe`, keeps the
 * public string API (slot extra classes appended last), and the second, `resolveSlotStyles`, is
 * package-private composition input for a component to pass a slot's compiled styles into
 * `stylex.props` before its public `xstyle` value.
 */
export function createSlottedRecipe<
	const Slot extends string,
	const Variants extends SlotVariantGroups<Slot>,
>(
	config: MultiPartConfig<Slot, Variants>,
): readonly [
	recipe: MultiPartRecipe<Slot, Variants>,
	resolveSlotStyles: (
		slotName: Slot,
		selection?: SlotVariantSelection<Variants>,
	) => Array<StyleXStyle>,
] {
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

	return [
		(selection) => {
			const slots = {} as Record<Slot, SlotFn>;

			for (const slotName of slotNames) {
				slots[slotName] = (extraClass) =>
					cx(resolveClassName(resolveSlotStyles(slotName, selection)), extraClass);
			}

			return slots;
		},
		resolveSlotStyles,
	];
}

function resolveSlotVariants<Slot extends string>(
	slotName: Slot,
	variantGroups: SlotVariantGroups<Slot> | undefined,
): VariantGroups | undefined {
	if (variantGroups === undefined) return undefined;

	const resolved: VariantGroups = {};
	for (const [group, values] of Object.entries(variantGroups)) {
		const perValue: Record<string, StyleXStyle> = {};

		for (const [value, slotStyles] of Object.entries(values)) {
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
			if (style !== undefined) styles.push(style);
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

function resolveClassName(styles: Array<StyleXStyle>): string {
	return stylex.props(...styles).className ?? '';
}

/** Variant selections arrive as real booleans but are keyed as `'true'`/`'false'`. */
function toVariantKey(value: unknown): string {
	return String(value);
}
