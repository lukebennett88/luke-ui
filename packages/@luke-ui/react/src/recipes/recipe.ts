import type { StyleRule } from '@vanilla-extract/css';
import { addFunctionSerializer } from '@vanilla-extract/css/functionSerializer';
import { recipe as vanillaRecipe } from '@vanilla-extract/recipes';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import { cx } from '../utils/index.js';

/**
 * `recipe()` styling helper for Vanilla Extract.
 *
 * One helper builds both single-part and multi-part (slotted) recipes and emits
 * static CSS in the `recipes` cascade layer. You pick variants at the outer call.
 * A single-part recipe returns a class string. A multi-part recipe returns one
 * function per slot, each taking an optional extra class to merge.
 *
 * Every style position — a slot, a variant value, a compound variant, a single-part
 * `base` — takes a style object, a class string, or an array composing both, so a
 * block shared by two slots can be emitted once as a class and composed into each
 * rather than duplicated in the output.
 *
 * `recipe()` runs at build time inside a `.css.ts` module. It splits a slotted
 * config into one recipe per slot, in declaration order, so its generated CSS and
 * class names match hand-written per-slot recipes byte-for-byte, and it wraps every
 * emitted style in the `recipes` cascade layer inline. Vanilla Extract only serialises `.css.ts`
 * exports, and a plain `.ts` helper cannot import a value from a function-exporting
 * `.css.ts` (such as `layered-style`) without turning that module into a failing
 * serialization boundary, so the `recipes`-layer wrapping is applied here directly
 * over `layers.recipes`. The returned function is registered with Vanilla Extract's
 * function serializer so it survives the `.css.ts` build boundary, and
 * `createRecipe`/`createSingleRecipe` rebuild it at runtime.
 */

// ---------------------------------------------------------------------------
// Config surface (types)
// ---------------------------------------------------------------------------

/** One part of a recipe style: a layered style object or a pre-built class string. */
type RecipeStylePart = DistributiveOmit<StyleRule, '@layer'> | string;

/**
 * A style rule authored for a recipe: a single part, or an array composing several
 * parts (Vanilla Extract's `ComplexStyleRule`). Composing a shared class into two
 * slots emits that block once instead of per slot.
 */
type RecipeStyleRule = RecipeStylePart | ReadonlyArray<RecipeStylePart>;

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

/** Slotted recipe config. */
interface MultiPartConfig<Slot extends string, Variants extends SlotVariantGroups<Slot>> {
	slots: Record<Slot, RecipeStyleRule>;
	variants?: Variants;
	defaultVariants?: SlotVariantSelection<Variants>;
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
 * `recipe()`'s structural inference). Slots and variant values may also be class
 * strings or `as const` arrays composing a shared class with local overrides.
 */
export interface SlottedConfigInput {
	slots: Record<string, RecipeStyleRule>;
	variants?: Record<string, Record<string, Record<string, RecipeStyleRule>>>;
	defaultVariants?: Record<string, string | number | boolean>;
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
	if (isMultiPart(config)) {
		const descriptor = buildSlottedDescriptor(config);
		const fn = createRecipe(descriptor);
		registerSerializer(fn, 'createRecipe', [descriptor]);
		return fn;
	}

	const built = buildSinglePart(config);
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
 * args carry built recipe runtime functions (each marked by the serializer)
 * alongside plain descriptor data. They serialise correctly at build time even
 * though the `Serializable` arg type cannot express the recipe functions, so the
 * array is bridged to that type here.
 */
function registerSerializer(fn: object, importName: string, args: ReadonlyArray<unknown>): void {
	addFunctionSerializer(fn, {
		importPath: SERIALIZER_IMPORT_PATH,
		importName,
		args: args as SerializerArgs,
	});
}

function buildSinglePart(config: SinglePartConfig<VariantGroups>): BuiltRecipe {
	return recipeInRecipesLayer({
		...(config.base === undefined ? {} : { base: config.base }),
		...(config.variants === undefined ? {} : { variants: config.variants }),
		...(config.defaultVariants === undefined ? {} : { defaultVariants: config.defaultVariants }),
		...(config.compoundVariants === undefined ? {} : { compoundVariants: config.compoundVariants }),
	});
}

function buildSlottedDescriptor(config: AnyMultiPartConfig): SlottedRecipeDescriptor {
	const slotNames = Object.keys(config.slots);
	const slots: Record<string, BuiltRecipe> = {};
	const slotGroups: Record<string, ReadonlyArray<string>> = {};

	for (const slotName of slotNames) {
		const variants: Record<string, Record<string, RecipeStyleRule>> = {};
		const groupsForSlot: Array<string> = [];

		if (config.variants !== undefined) {
			for (const [group, values] of Object.entries(config.variants)) {
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

		const defaultVariants = pickGroups(config.defaultVariants, groupsForSlot);

		slots[slotName] = recipeInRecipesLayer({
			base: config.slots[slotName],
			...(groupsForSlot.length > 0 ? { variants } : {}),
			...(defaultVariants !== undefined && Object.keys(defaultVariants).length > 0
				? { defaultVariants }
				: {}),
		});
		slotGroups[slotName] = groupsForSlot;
	}

	return { slots, slotGroups };
}

// ---------------------------------------------------------------------------
// Layer wrapping (wraps every style in the `recipes` layer)
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

function withRecipesLayerIfObject(part: RecipeStylePart): RecipeStylePart {
	return typeof part === 'string' ? part : withRecipesLayer(part);
}

/**
 * Wraps an authored style in the `recipes` layer. A composed style (an array) is
 * mapped part by part: style objects are wrapped exactly as a lone object would be,
 * and class strings pass through untouched — a class already carries its own layer.
 */
function withLayerIfStyleRule(styleRule: RecipeStyleRule): RecipeStyleRule {
	return isComposedStyle(styleRule)
		? styleRule.map(withRecipesLayerIfObject)
		: withRecipesLayerIfObject(styleRule);
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
// Config shape detection
// ---------------------------------------------------------------------------

function isMultiPart(
	config: AnyMultiPartConfig | SinglePartConfig<VariantGroups>,
): config is AnyMultiPartConfig {
	return 'slots' in config && isObject(config.slots);
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isComposedStyle(styleRule: RecipeStyleRule): styleRule is ReadonlyArray<RecipeStylePart> {
	return Array.isArray(styleRule);
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
