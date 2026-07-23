import type { StyleRule } from '@vanilla-extract/css';
import { addFunctionSerializer } from '@vanilla-extract/css/functionSerializer';
import { recipe as vanillaRecipe } from '@vanilla-extract/recipes';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import { cx } from '../utils/index.js';

/**
 * HeroUI/Tailwind-Variants-style `recipe()` for Vanilla Extract.
 *
 * One helper builds both single-part and multi-part (slotted) recipes and emits
 * static CSS in the `recipes` cascade layer. Variant selection happens at the
 * outer call. A single-part recipe returns a class string. A multi-part recipe
 * returns one function per slot, each accepting an optional extra class to merge.
 *
 * `recipe()` runs at build time inside a `.css.ts` module: it decomposes a
 * slotted config into one recipe per slot, in slot-declaration order, so its
 * generated CSS and class names match the equivalent hand-written per-slot
 * recipes byte-for-byte. It reproduces the `recipeInLayer` wrapping inline.
 * Vanilla Extract only serialises `.css.ts` exports, and a plain `.ts` helper
 * cannot import a value from a function-exporting `.css.ts` (e.g. `layered-style`)
 * without turning that module into a failing serialization boundary, so the
 * `recipes`-layer wrapping is applied here directly over `layers.recipes`. The
 * returned callable is registered with Vanilla Extract's function serializer so
 * it survives the `.css.ts` build boundary, and `createRecipe`/`createSingleRecipe`
 * reconstruct it at runtime.
 */

// ---------------------------------------------------------------------------
// Config surface (types)
// ---------------------------------------------------------------------------

/** A style rule authored for a recipe: a layered style object or a pre-built class string. */
type RecipeStyleRule = DistributiveOmit<StyleRule, '@layer'> | string;

/** Maps the string variant keys `'true'`/`'false'` onto `boolean` for selection. */
type BooleanMap<T> = T extends 'true' | 'false' ? boolean : T;

/** Variant groups for a single-part recipe: group name to value name to style rule. */
type VariantGroups = Record<string, Record<string, RecipeStyleRule>>;

/** Outer selection for a single-part recipe. */
type VariantSelection<Variants extends VariantGroups> = {
	-readonly [Group in keyof Variants]?: BooleanMap<keyof Variants[Group]> | undefined;
};

/** A compound variant for a single-part recipe. */
interface CompoundVariant<Variants extends VariantGroups> {
	variants: VariantSelection<Variants>;
	style: RecipeStyleRule;
}

/** Single-part recipe config. */
interface SinglePartConfig<Variants extends VariantGroups> {
	base?: RecipeStyleRule;
	variants?: Variants;
	defaultVariants?: VariantSelection<Variants>;
	compoundVariants?: Array<CompoundVariant<Variants>>;
	extend?: SinglePartConfig<VariantGroups>;
}

/** The runtime function a single-part `recipe()` returns. */
type SinglePartRecipe<Variants extends VariantGroups> = (
	selection?: VariantSelection<Variants>,
) => string;

/** A per-slot style map: slot name to style for that slot. */
type SlotStyles<Slot extends string> = Partial<Record<Slot, RecipeStyleRule>>;

/** Variant groups for a slotted recipe: group to value to per-slot styles. */
type SlotVariantGroups<Slot extends string> = Record<string, Record<string, SlotStyles<Slot>>>;

/** Outer selection for a slotted recipe. */
type SlotVariantSelection<Variants extends SlotVariantGroups<string>> = {
	-readonly [Group in keyof Variants]?: BooleanMap<keyof Variants[Group]> | undefined;
};

/** A compound variant for a slotted recipe, whose style is keyed by slot. */
interface SlotCompoundVariant<Slot extends string, Variants extends SlotVariantGroups<Slot>> {
	variants: SlotVariantSelection<Variants>;
	style: SlotStyles<Slot>;
}

/** Slotted recipe config. */
interface MultiPartConfig<Slot extends string, Variants extends SlotVariantGroups<Slot>> {
	slots: Record<Slot, RecipeStyleRule>;
	variants?: Variants;
	defaultVariants?: SlotVariantSelection<Variants>;
	compoundVariants?: Array<SlotCompoundVariant<Slot, Variants>>;
	extend?: MultiPartConfig<Slot, SlotVariantGroups<Slot>>;
}

/** A single slot function: takes an optional extra class and returns a class string. */
type SlotFn = (extraClass?: string) => string;

/** The runtime function a slotted `recipe()` returns. */
type MultiPartRecipe<Slot extends string, Variants extends SlotVariantGroups<Slot>> = (
	selection?: SlotVariantSelection<Variants>,
) => Record<Slot, SlotFn>;

/** A raw slotted config as accepted by `recipe`. Internal to this module. */
type AnyMultiPartConfig = MultiPartConfig<string, SlotVariantGroups<string>>;

/**
 * Authoring constraint for a slotted config. Apply it with
 * `{ … } as const satisfies SlottedConfigInput` at the definition site: `as const`
 * keeps the literal slot names and variant values that `recipe()` infers, while
 * `satisfies` type-checks every slot and variant style against `StyleRule` (so a
 * mistyped CSS property is caught where it is written, not silently accepted by
 * `recipe()`'s structural inference).
 */
export interface SlottedConfigInput {
	slots: Record<string, RecipeStyleRule>;
	variants?: Record<string, Record<string, Record<string, RecipeStyleRule>>>;
	defaultVariants?: Record<string, string | number | boolean>;
	compoundVariants?: ReadonlyArray<{
		variants: Record<string, string | number | boolean>;
		style: Record<string, RecipeStyleRule>;
	}>;
}

/** Derives the outer variant selection type for a built recipe. */
export type RecipeSelection<Fn> = Fn extends (selection?: infer Selection) => unknown
	? NonNullable<Selection>
	: never;

// ---------------------------------------------------------------------------
// recipe (build time)
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
	if ('slots' in config && isObject(config.slots)) {
		const descriptor = buildSlottedDescriptor(config);
		const fn = createRecipe(descriptor);
		registerSerializer(fn, 'createRecipe', [descriptor]);
		return fn;
	}

	const built = buildSinglePart(config as SinglePartConfig<VariantGroups>);
	const fn = createSingleRecipe(built);
	registerSerializer(fn, 'createSingleRecipe', [built]);
	return fn;
}

// ---------------------------------------------------------------------------
// Build helpers
// ---------------------------------------------------------------------------

const SERIALIZER_IMPORT_PATH = './recipe.js';

/** The `args` position of `addFunctionSerializer`'s config. */
type SerializerArgs = Parameters<typeof addFunctionSerializer>[1]['args'];

/**
 * Registers a runtime constructor with Vanilla Extract's function serializer. The
 * args carry built recipe runtime fns (each marked by the serializer) alongside
 * plain descriptor data. They serialise correctly at build time even though the
 * `Serializable` arg type cannot express the recipe fns, so the array is bridged
 * to that type here.
 */
function registerSerializer(fn: object, importName: string, args: ReadonlyArray<unknown>): void {
	addFunctionSerializer(fn, {
		importPath: SERIALIZER_IMPORT_PATH,
		importName,
		args: args as unknown as SerializerArgs,
	});
}

function buildSinglePart(config: SinglePartConfig<VariantGroups>): BuiltRecipe {
	const resolved = config.extend ? mergeSingleConfigs(config.extend, config) : config;

	return recipeInRecipesLayer({
		...(resolved.base === undefined ? {} : { base: resolved.base }),
		...(resolved.variants === undefined ? {} : { variants: resolved.variants }),
		...(resolved.defaultVariants === undefined
			? {}
			: { defaultVariants: resolved.defaultVariants }),
		...(resolved.compoundVariants === undefined
			? {}
			: { compoundVariants: resolved.compoundVariants }),
	});
}

function mergeSingleConfigs(
	base: SinglePartConfig<VariantGroups>,
	override: SinglePartConfig<VariantGroups>,
): SinglePartConfig<VariantGroups> {
	const variants: VariantGroups = { ...base.variants };
	if (override.variants !== undefined) {
		for (const [group, values] of Object.entries(override.variants)) {
			variants[group] = { ...variants[group], ...values };
		}
	}

	const mergedBase = override.base ?? base.base;

	return {
		...(mergedBase === undefined ? {} : { base: mergedBase }),
		...(Object.keys(variants).length > 0 ? { variants } : {}),
		defaultVariants: { ...base.defaultVariants, ...override.defaultVariants },
		compoundVariants: [...(base.compoundVariants ?? []), ...(override.compoundVariants ?? [])],
	};
}

function buildSlottedDescriptor(config: AnyMultiPartConfig): SlottedRecipeDescriptor {
	const resolved = config.extend ? mergeConfigs(config.extend, withoutExtend(config)) : config;

	const slotNames = Object.keys(resolved.slots);
	const slots: Record<string, BuiltRecipe> = {};
	const slotGroups: Record<string, ReadonlyArray<string>> = {};

	for (const slotName of slotNames) {
		const variants: Record<string, Record<string, RecipeStyleRule>> = {};
		const groupsForSlot: Array<string> = [];

		if (resolved.variants !== undefined) {
			for (const [group, values] of Object.entries(resolved.variants)) {
				const slotValues: Record<string, RecipeStyleRule> = {};
				let hasSlot = false;

				for (const [value, slotStyles] of Object.entries(values)) {
					const style = slotStyles[slotName];
					if (style !== undefined) {
						slotValues[value] = style;
						hasSlot = true;
					}
				}

				if (hasSlot) {
					variants[group] = slotValues;
					groupsForSlot.push(group);
				}
			}
		}

		const compoundVariants: Array<{ variants: Record<string, unknown>; style: RecipeStyleRule }> =
			[];
		if (resolved.compoundVariants !== undefined) {
			for (const compound of resolved.compoundVariants) {
				const style = compound.style[slotName];
				if (style !== undefined) {
					compoundVariants.push({ variants: compound.variants, style });
				}
			}
		}

		const defaultVariants = pickDefaults(resolved.defaultVariants, groupsForSlot);

		slots[slotName] = recipeInRecipesLayer({
			base: resolved.slots[slotName],
			...(groupsForSlot.length > 0 ? { variants } : {}),
			...(defaultVariants !== undefined && Object.keys(defaultVariants).length > 0
				? { defaultVariants }
				: {}),
			...(compoundVariants.length > 0 ? { compoundVariants } : {}),
		});
		slotGroups[slotName] = groupsForSlot;
	}

	return { slots, slotGroups };
}

function pickDefaults(
	defaults: SlotVariantSelection<SlotVariantGroups<string>> | undefined,
	groups: ReadonlyArray<string>,
): Record<string, unknown> | undefined {
	if (defaults === undefined) return undefined;

	const source = defaults as Record<string, unknown>;
	const picked: Record<string, unknown> = {};
	for (const group of groups) {
		if (group in source) picked[group] = source[group];
	}
	return picked;
}

// ---------------------------------------------------------------------------
// Layer wrapping (mirrors `recipeInLayer` for the `recipes` layer)
// ---------------------------------------------------------------------------

type LayeredStyleRule = DistributiveOmit<StyleRule, '@layer'>;

// `layers.recipes` from `styles/layers.css.ts` resolves to this literal global
// layer name. It is inlined rather than imported because importing a value from a
// `.css.ts` into this plain `.ts` would turn `layers.css.ts` into a serialization
// boundary and re-emit its `@layer` declarations. The byte-comparison build
// proves this matches the shipped `@layer recipes { … }` wrapping.
const RECIPES_LAYER = 'recipes';

interface RecipeInLayerOptions {
	base?: RecipeStyleRule;
	variants?: Record<string, Record<string, RecipeStyleRule>>;
	defaultVariants?: Record<string, unknown>;
	compoundVariants?: Array<{ variants: Record<string, unknown>; style: RecipeStyleRule }>;
}

function withRecipesLayer(rule: LayeredStyleRule): StyleRule {
	return { '@layer': { [RECIPES_LAYER]: rule } };
}

function withLayerIfStyleRule(styleRule: RecipeStyleRule): RecipeStyleRule {
	return typeof styleRule === 'string' ? styleRule : withRecipesLayer(styleRule);
}

/** Builds a Vanilla Extract recipe with every style wrapped in the `recipes` layer. */
function recipeInRecipesLayer(options: RecipeInLayerOptions): BuiltRecipe {
	const layeredVariants =
		options.variants === undefined
			? undefined
			: Object.fromEntries(
					Object.entries(options.variants).map(([variantName, variantValues]) => [
						variantName,
						Object.fromEntries(
							Object.entries(variantValues).map(([variantValue, styleRule]) => [
								variantValue,
								withLayerIfStyleRule(styleRule),
							]),
						),
					]),
				);

	const layeredCompoundVariants =
		options.compoundVariants === undefined
			? undefined
			: options.compoundVariants.map((compound) => ({
					...compound,
					style: withLayerIfStyleRule(compound.style),
				}));

	// `vanillaRecipe`'s generic infers a variant map from a statically-known config.
	// This helper assembles the config dynamically (per slot, with layered rules), so
	// the input is bridged through `never` and the result through the recipe's own
	// runtime contract, `BuiltRecipe`.
	const built = vanillaRecipe({
		...options,
		...(options.base === undefined ? {} : { base: withLayerIfStyleRule(options.base) }),
		...(layeredVariants === undefined ? {} : { variants: layeredVariants }),
		...(layeredCompoundVariants === undefined ? {} : { compoundVariants: layeredCompoundVariants }),
	} as never);

	return built as BuiltRecipe;
}

// ---------------------------------------------------------------------------
// extend (single-base inheritance)
// ---------------------------------------------------------------------------

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function withoutExtend(config: AnyMultiPartConfig): AnyMultiPartConfig {
	const { extend: _extend, ...rest } = config;
	return rest;
}

/**
 * Merges a slotted config's single `extend` base into it. Slots, variant groups,
 * variant values, per-slot variant styles, and default variants are combined. The
 * extending config takes precedence on same-named keys, and compound variants are
 * concatenated. Internal to `extend` resolution.
 */
function mergeConfigs(...configs: Array<AnyMultiPartConfig>): AnyMultiPartConfig {
	const slots: Record<string, RecipeStyleRule> = {};
	const variants: Record<string, Record<string, SlotStyles<string>>> = {};
	const defaultVariants: Record<string, unknown> = {};
	const compoundVariants: Array<SlotCompoundVariant<string, SlotVariantGroups<string>>> = [];

	for (const config of configs) {
		const resolved = config.extend ? mergeConfigs(config.extend, withoutExtend(config)) : config;

		Object.assign(slots, resolved.slots);

		if (resolved.variants !== undefined) {
			for (const [group, values] of Object.entries(resolved.variants)) {
				const mergedGroup = variants[group] ?? {};
				for (const [value, slotStyles] of Object.entries(values)) {
					mergedGroup[value] = { ...mergedGroup[value], ...slotStyles };
				}
				variants[group] = mergedGroup;
			}
		}

		if (resolved.defaultVariants !== undefined) {
			Object.assign(defaultVariants, resolved.defaultVariants);
		}

		if (resolved.compoundVariants !== undefined) {
			compoundVariants.push(...resolved.compoundVariants);
		}
	}

	return {
		slots,
		...(Object.keys(variants).length > 0 ? { variants } : {}),
		...(Object.keys(defaultVariants).length > 0
			? { defaultVariants: defaultVariants as SlotVariantSelection<SlotVariantGroups<string>> }
			: {}),
		...(compoundVariants.length > 0 ? { compoundVariants } : {}),
	};
}

// ---------------------------------------------------------------------------
// Runtime (referenced by the function serializer at import time)
// ---------------------------------------------------------------------------

/** A built Vanilla Extract recipe runtime function (one per slot, or the whole single-part recipe). */
type BuiltRecipe = (selection?: Record<string, unknown>) => string;

/** Serialized descriptor for a slotted recipe: per-slot runtime fns and their variant groups. */
interface SlottedRecipeDescriptor {
	slots: Record<string, BuiltRecipe>;
	slotGroups: Record<string, ReadonlyArray<string>>;
}

/** Narrows an outer selection to the variant groups a given slot actually uses. */
function pickGroups(
	selection: Record<string, unknown> | undefined,
	groups: ReadonlyArray<string>,
): Record<string, unknown> | undefined {
	if (selection === undefined) return undefined;

	const picked: Record<string, unknown> = {};
	for (const group of groups) {
		if (group in selection) picked[group] = selection[group];
	}
	return picked;
}

/**
 * Rebuilds a slotted recipe: `recipe(selection)` returns one function per slot,
 * each taking an optional extra class. Slots evaluate lazily, so reading one slot
 * does not compute the others.
 *
 * @public Imported by path string via Vanilla Extract's function serializer, so
 * the reference is invisible to static analysis.
 */
export function createRecipe(descriptor: SlottedRecipeDescriptor) {
	const slotEntries = Object.entries(descriptor.slots);

	return (selection?: Record<string, unknown>): Record<string, SlotFn> => {
		const slots: Record<string, SlotFn> = {};
		for (const [slotName, built] of slotEntries) {
			const groups = descriptor.slotGroups[slotName] ?? [];
			slots[slotName] = (extraClass) => cx(built(pickGroups(selection, groups)), extraClass);
		}
		return slots;
	};
}

/**
 * Rebuilds a single-part recipe: `recipe(selection)` returns a class string.
 *
 * @public Imported by path string via Vanilla Extract's function serializer, so
 * the reference is invisible to static analysis.
 */
export function createSingleRecipe(built: BuiltRecipe) {
	return (selection?: Record<string, unknown>): string => built(selection);
}
