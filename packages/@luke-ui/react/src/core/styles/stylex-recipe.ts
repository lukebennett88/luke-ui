import * as stylex from '@stylexjs/stylex';
import { cx } from '../../shared/utils/utils.js';

/**
 * `recipe()` styling helper for StyleX, mirroring the public contract of the Vanilla Extract
 * `recipe()` in `./recipe.ts` exactly:
 *
 *   single-part: recipe(config) => (selection?) => string
 *   slotted:     recipe(config) => (selection?) => Record<Slot, (extraClass?) => string>
 *
 * The caller performs the `stylex.create(...)` calls itself — that stays statically analysable,
 * which is what lets the StyleX compiler extract them. This engine only indexes the resulting
 * opaque style objects at runtime and folds them through `stylex.props`, in `base`, then variant
 * groups in config order, then compound variants last: `stylex.props` applies last-wins per
 * property, so that ordering is what gives compound variants precedence over the simple variants
 * they overlap. A slotted recipe narrows each slot to only the variant groups that declare a
 * style for that slot, and computes a slot's class string lazily, only when its function is
 * called. `extraClass` is appended last, after every resolved style.
 *
 * `recipe()` never returns a StyleX style object or an inline `style`, only a class name string,
 * matching the Vanilla Extract engine's contract. See `resolveClassName` for the one place that
 * would surface a `style` StyleX produced but the string contract cannot carry.
 */

// ---------------------------------------------------------------------------
// Config surface (types)
// ---------------------------------------------------------------------------

/**
 * An opaque compiled StyleX style value — what `stylex.create` puts in each key of the object it
 * returns.
 *
 * Deliberately narrowed to `object`, not StyleX's exported `StyleXStyles` and not
 * `Parameters<typeof stylex.props>[number]`: both of those are unions that include
 * `null | undefined | false` and arrays, which makes the single-part and slotted overloads below
 * structurally indistinguishable. A slotted config's `Record<Slot, StyleXStyle>` also structurally
 * satisfies the single-part config's variant-value shape once `StyleXStyle` admits those falsy
 * members, so TypeScript would pick the slotted overload even for a single-part config and type
 * the result `Record<string, SlotFn>` instead of `string`. A compiled style is always a non-null
 * object (`{ $$css: true, ... }`), so narrowing to `object` is both accurate and keeps `slots`
 * (values are objects) structurally distinct from `variants` (values are records of objects).
 */
type StyleXStyle = object;

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

/** The runtime function a single-part `recipe()` returns. */
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

/** The runtime function a slotted `recipe()` returns. */
type MultiPartRecipe<Slot extends string, Variants extends SlotVariantGroups<Slot>> = (
	selection?: SlotVariantSelection<Variants>,
) => Record<Slot, SlotFn>;

/** A raw slotted config as accepted by `recipe`. Internal to this module. */
type AnyMultiPartConfig = MultiPartConfig<string, SlotVariantGroups<string>>;

/** Derives the outer variant selection type for a built recipe. Mirrors `./recipe.ts`'s export. */
export type RecipeSelection<Fn> = Fn extends (selection?: infer Selection) => unknown
	? NonNullable<Selection>
	: never;

// ---------------------------------------------------------------------------
// recipe (runtime)
// ---------------------------------------------------------------------------

/** Builds a slotted recipe (variant selection at the outer call, one function per slot). */
export function recipe<const Slot extends string, const Variants extends SlotVariantGroups<Slot>>(
	config: MultiPartConfig<Slot, Variants>,
): MultiPartRecipe<Slot, Variants>;

/** Builds a single-part recipe (variant selection at the outer call, returns a class string). */
export function recipe<const Variants extends VariantGroups>(
	config: SinglePartConfig<Variants>,
): SinglePartRecipe<Variants>;

export function recipe(config: AnyMultiPartConfig | SinglePartConfig<VariantGroups>): unknown {
	if (isMultiPart(config)) return buildSlotted(config);
	return buildSinglePart(config);
}

// ---------------------------------------------------------------------------
// Build helpers
// ---------------------------------------------------------------------------

function buildSinglePart(config: SinglePartConfig<VariantGroups>): SinglePartRecipe<VariantGroups> {
	return (selection) => {
		const selected = { ...config.defaultVariants, ...selection };
		const styles = resolveStyles(config.base, config.variants, config.compoundVariants, selected);
		return resolveClassName(styles);
	};
}

/**
 * Per-slot narrowing, precomputed once at build time: a slot only ever sees the variant groups
 * that actually declare a style for it, mirroring `./recipe.ts`'s `slotGroups`/`pickGroups`.
 */
function buildSlotted(
	config: AnyMultiPartConfig,
): MultiPartRecipe<string, SlotVariantGroups<string>> {
	const slotNames = Object.keys(config.slots);

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
		const selected = { ...config.defaultVariants, ...selection };
		const slots: Record<string, SlotFn> = {};

		for (const slotName of slotNames) {
			// Lazy: the class string is only computed when the slot function is called.
			slots[slotName] = (extraClass) => {
				const narrowed = pickGroups(selected, slotGroups[slotName] ?? []);
				const styles = resolveStyles(
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

/**
 * Resolves a selection to the ordered list of compiled styles: base, then variant groups in
 * config order, then compound variants last. `stylex.props` applies last-wins per property, so
 * this ordering is the precedence.
 */
function resolveStyles(
	base: StyleXStyle | undefined,
	variants: VariantGroups | undefined,
	compoundVariants: Array<CompoundVariant<VariantGroups>> | undefined,
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

/** Narrows an outer selection to the variant groups a given slot actually uses. */
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

/**
 * Folds compiled styles through `stylex.props` and returns only the class string. `stylex.props`
 * also returns a `style` object carrying any dynamic (non-statically-extractable) values, but
 * every style this engine resolves comes straight out of a `stylex.create` result — which never
 * carries a dynamic value — so `style` is always empty here and is deliberately discarded: the
 * public contract is a string, and there is no dynamic value for an inline `style` to represent.
 */
function resolveClassName(styles: Array<StyleXStyle>): string {
	// The one contained cast in this module. `styles` only ever holds values taken directly out of
	// a `stylex.create` result, which is exactly what `stylex.props` accepts; the cast is needed
	// only because `StyleXStyle` is narrowed to `object` so the two `recipe()` overloads stay
	// distinguishable — see the note on that type above.
	const { className } = stylex.props(...(styles as Array<Parameters<typeof stylex.props>[number]>));
	return className ?? '';
}

/** Variant selections arrive as real booleans but are keyed as `'true'`/`'false'`. */
function toVariantKey(value: unknown): string {
	return String(value);
}

function isMultiPart(
	config: AnyMultiPartConfig | SinglePartConfig<VariantGroups>,
): config is AnyMultiPartConfig {
	return 'slots' in config && isObject(config.slots);
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
