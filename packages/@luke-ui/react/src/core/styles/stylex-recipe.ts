import type { CompiledStyles } from '@stylexjs/stylex';
import * as stylex from '@stylexjs/stylex';
import { cx } from '../../shared/utils/utils.js';

/** A compiled StyleX style returned by a `stylex.create(...)` entry. */
type StyleXStyle = CompiledStyles;

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
	base?: StyleXStyle;
	compoundVariants?: Array<CompoundVariant<Variants>>;
	defaultVariants?: VariantSelection<Variants>;
	variants?: Variants;
}

/** The public string-returning function for a single-part recipe. */
type SinglePartRecipe<Variants extends VariantGroups> = (
	selection?: VariantSelection<Variants>,
) => string;

/** A per-slot style map: slot name to compiled style for that slot. */
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
	slots: Record<Slot, StyleXStyle>;
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
 * Builds a single-part recipe with two deliberately separate internal views. `recipe` keeps the
 * public string API; `resolveStyles` is package-private composition input for a component to pass
 * into `stylex.props` before its public `xstyle` value.
 */
export function createSingleRecipe<const Variants extends VariantGroups>(
	config: SinglePartConfig<Variants>,
): {
	recipe: SinglePartRecipe<Variants>;
	resolveStyles: (selection?: VariantSelection<Variants>) => Array<StyleXStyle>;
} {
	function resolveStyles(selection?: VariantSelection<Variants>): Array<StyleXStyle> {
		const selected = mergeSelection(config.defaultVariants, selection);
		return resolveSinglePartStyles(config.base, config.variants, config.compoundVariants, selected);
	}

	return {
		recipe: (selection) => resolveClassName(resolveStyles(selection)),
		resolveStyles,
	};
}

/**
 * Builds a slotted string recipe. Slots have no public raw StyleX surface: this factory only
 * exposes their string functions, retaining the same public recipe contract as Vanilla Extract.
 */
export function createSlottedRecipe<
	const Slot extends string,
	const Variants extends SlotVariantGroups<Slot>,
>(config: MultiPartConfig<Slot, Variants>): MultiPartRecipe<Slot, Variants> {
	const slotNames = Object.keys(config.slots) as Array<Slot>;
	const slotGroups: Record<string, Array<string>> = {};
	const slotVariants: Record<string, VariantGroups> = {};

	for (const slotName of slotNames) {
		const groups: Array<string> = [];
		const variants: VariantGroups = {};

		if (config.variants !== undefined) {
			for (const [group, values] of Object.entries(config.variants)) {
				const perValue: Record<string, StyleXStyle> = {};
				let usesSlot = false;

				for (const [value, slotStyles] of Object.entries(values)) {
					const style = slotStyles[slotName];
					if (style !== undefined) {
						perValue[value] = style;
						usesSlot = true;
					}
				}

				if (usesSlot) {
					variants[group] = perValue;
					groups.push(group);
				}
			}
		}

		slotGroups[slotName] = groups;
		slotVariants[slotName] = variants;
	}

	return (selection) => {
		const selected = mergeSelection(config.defaultVariants, selection);
		const slots = {} as Record<Slot, SlotFn>;

		for (const slotName of slotNames) {
			slots[slotName] = (extraClass) => {
				const narrowed = pickGroups(selected, slotGroups[slotName] ?? []);
				const styles = resolveSinglePartStyles(
					config.slots[slotName],
					slotVariants[slotName],
					undefined,
					narrowed,
				);
				return cx(resolveClassName(styles), extraClass);
			};
		}

		return slots;
	};
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
	base: StyleXStyle | undefined,
	variants: Variants | undefined,
	compoundVariants: Array<CompoundVariant<Variants>> | undefined,
	selected: Record<string, unknown>,
): Array<StyleXStyle> {
	const styles: Array<StyleXStyle> = [];
	if (base !== undefined) styles.push(base);

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

function pickGroups(
	selection: Record<string, unknown>,
	groups: ReadonlyArray<string>,
): Record<string, unknown> {
	const picked: Record<string, unknown> = {};
	for (const group of groups) {
		if (group in selection) picked[group] = selection[group];
	}
	return picked;
}

function resolveClassName(styles: Array<StyleXStyle>): string {
	return stylex.props(...styles).className ?? '';
}

/** Variant selections arrive as real booleans but are keyed as `'true'`/`'false'`. */
function toVariantKey(value: unknown): string {
	return String(value);
}
