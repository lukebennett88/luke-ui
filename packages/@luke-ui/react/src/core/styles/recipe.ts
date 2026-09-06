import type { StyleRule } from '@vanilla-extract/css';
import { style as vanillaStyle } from '@vanilla-extract/css';
import { addFunctionSerializer } from '@vanilla-extract/css/functionSerializer';
import { recipe as vanillaRecipe } from '@vanilla-extract/recipes';
import { cx } from '../../shared/utils/utils.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';

/**
 * `recipe()` styling helper for Vanilla Extract.
 *
 * One helper builds both single-part and multi-part (slotted) recipes and emits
 * static CSS in the `recipes` cascade layer. You pick variants at the outer call.
 * A single-part recipe takes its variant selection plus an optional consumer
 * `className` and returns the finished class string. A multi-part recipe returns
 * one function per slot, each taking optional `{ className }` to append.
 *
 * `recipe()` runs at build time inside a `.css.ts` module. Without `compoundSlots`,
 * slotted recipes emit the same CSS as hand-written per-slot recipes in declaration
 * order. Shared compound styles emit once, with source order controlling precedence.
 *
 * Layer wrapping lives here because importing the function-exporting `layered-style.css.ts`
 * would create a failing Vanilla Extract serialization boundary. The function serializer
 * registers `createRecipe` and `createSingleRecipe` to rebuild the recipes at runtime.
 */

// ---------------------------------------------------------------------------
// Config surface (types)
// ---------------------------------------------------------------------------

/** A pre-built class string, or an array composing several (possibly nested). */
type ClassNames = string | ReadonlyArray<ClassNames>;

/** One part of a recipe style: a layered style object or pre-built class name(s). */
type RecipeStylePart = DistributiveOmit<StyleRule, '@layer'> | ClassNames;

/** A style rule authored for a recipe: one part, or an array composing several. */
type RecipeStyleRule =
	| RecipeStylePart
	| ReadonlyArray<DistributiveOmit<StyleRule, '@layer'> | ClassNames>;

/** Maps the string variant keys `'true'`/`'false'` onto `boolean` for selection. */
type BooleanMap<T> = T extends 'true' | 'false' ? boolean : T;

/** Variant groups for a single-part recipe: group name to value name to style rule. */
type VariantGroups = Record<string, Record<string, RecipeStyleRule>>;

/**
 * True when `Variants` carries no authored variant groups: either `keyof Variants`
 * is `never` (an explicit `variants: {}`), or inference had no `variants` property
 * to read at all and fell back to the bare `VariantGroups` constraint, whose key
 * type is the unconstrained `string`. A real recipe's variant groups are always
 * literal keys, so `string extends keyof Variants` only ever holds in that
 * fallback case.
 */
type HasNoVariants<Variants extends VariantGroups> = [keyof Variants] extends [never]
	? true
	: string extends keyof Variants
		? true
		: false;

/** Outer selection for a single-part recipe. */
type VariantSelection<Variants extends VariantGroups> =
	HasNoVariants<Variants> extends true
		? Record<string, never>
		: {
				-readonly [Group in keyof Variants]?: BooleanMap<keyof Variants[Group]> | undefined;
			};

/**
 * Composition options a built recipe accepts alongside its variant selection. `className` is a
 * consumer class appended to the recipe's own classes; it is not a variant and never reaches CSS.
 */
export interface RecipeComposition {
	className?: string;
}

/**
 * The full input a built single-part recipe accepts: its variant selection plus
 * `RecipeComposition`. A no-variant recipe accepts only the composition options, typed as a weak
 * object so an object literal with an undeclared key is still rejected.
 */
type RecipeInput<Variants extends VariantGroups> =
	HasNoVariants<Variants> extends true
		? RecipeComposition
		: {
				-readonly [Group in keyof Variants]?: BooleanMap<keyof Variants[Group]> | undefined;
			} & RecipeComposition;

/** A compound variant for a single-part recipe. */
interface CompoundVariant<Variants extends VariantGroups> {
	style: RecipeStyleRule;
	variants: VariantSelection<Variants>;
}

/** Single-part recipe config. */
interface SinglePartConfig<Variants extends VariantGroups> {
	base?: RecipeStyleRule;
	compoundVariants?: Array<CompoundVariant<Variants>>;
	defaultVariants?: VariantSelection<Variants>;
	variants?: Variants;
}

/** The runtime function a single-part `recipe()` returns. */
type SinglePartRecipe<Variants extends VariantGroups> = (input?: RecipeInput<Variants>) => string;

/** A per-slot style map: slot name to style for that slot. */
type SlotStyles<Slot extends string> = Partial<Record<Slot, RecipeStyleRule>>;

/** Variant groups for a slotted recipe: group to value to per-slot styles. */
type SlotVariantGroups<Slot extends string> = Record<string, Record<string, SlotStyles<Slot>>>;

/**
 * True when `Variants` carries no authored variant groups. See `HasNoVariants`
 * above — same reasoning, generalised to a slotted recipe's variant groups.
 */
type HasNoSlotVariants<Variants extends SlotVariantGroups<string>> = [keyof Variants] extends [
	never,
]
	? true
	: string extends keyof Variants
		? true
		: false;

/** Outer selection for a slotted recipe. */
type SlotVariantSelection<Variants extends SlotVariantGroups<string>> =
	HasNoSlotVariants<Variants> extends true
		? Record<string, never>
		: {
				-readonly [Group in keyof Variants]?: BooleanMap<keyof Variants[Group]> | undefined;
			};

/**
 * A style shared across slots, with an optional variant condition.
 *
 * `NoInfer` keeps `config.slots` and `config.variants` as the inference sources. Otherwise, an
 * invalid slot or variant here widens those types instead of producing an error.
 */
interface CompoundSlot<Slot extends string, Variants extends SlotVariantGroups<Slot>> {
	slots: ReadonlyArray<NoInfer<Slot>>;
	style: RecipeStyleRule;
	variants?: NoInfer<SlotVariantSelection<Variants>>;
}

/** Slotted recipe config. */
interface MultiPartConfig<Slot extends string, Variants extends SlotVariantGroups<Slot>> {
	compoundSlots?: Array<CompoundSlot<Slot, Variants>>;
	defaultVariants?: SlotVariantSelection<Variants>;
	slots: Record<Slot, RecipeStyleRule>;
	variants?: Variants;
}

/** A single slot function: takes optional composition options and returns a class string. */
type SlotFn = (options?: RecipeComposition) => string;

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
	compoundSlots?: Array<{
		slots: ReadonlyArray<string>;
		style: RecipeStyleRule;
		variants?: Record<string, string | number | boolean>;
	}>;
	defaultVariants?: Record<string, string | number | boolean>;
	slots: Record<string, RecipeStyleRule>;
	variants?: Record<string, Record<string, Record<string, RecipeStyleRule>>>;
}

/**
 * Derives the outer variant selection type for a built recipe. `className` is composition, not a
 * variant, so it is removed; a no-variant recipe derives `Record<string, never>`.
 */
export type RecipeSelection<Fn> = Fn extends (input?: infer Input) => unknown
	? VariantKeysOf<NonNullable<Input>>
	: never;

type VariantKeysOf<Input> = [Exclude<keyof Input, keyof RecipeComposition>] extends [never]
	? Record<string, never>
	: Omit<Input, keyof RecipeComposition>;

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

const SERIALIZER_IMPORT_PATH = '#recipe-engine';

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
		args: args as SerializerArgs,
		importName,
		importPath: SERIALIZER_IMPORT_PATH,
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

/** Per-slot shape derived from the raw config, before any CSS is emitted. */
interface SlotPlan {
	groupsForSlot: Array<string>;
	slotBase: RecipeStyleRule | undefined;
	variants: Record<string, Record<string, RecipeStyleRule>>;
}

function buildSlottedDescriptor(config: AnyMultiPartConfig): SlottedRecipeDescriptor {
	const slotNames = Object.keys(config.slots);
	const slots: Record<string, BuiltRecipe> = {};
	const slotGroups: Record<string, ReadonlyArray<string>> = {};
	const compoundSlots = config.compoundSlots ?? [];

	// Derive the slot plans before emitting CSS so slot styles precede shared compound styles.
	const plans: Record<string, SlotPlan> = {};
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

		// Keep groups used only by compound slots so `pickGroups` does not discard their selection.
		for (const compound of compoundSlots) {
			if (!compound.slots.includes(slotName)) continue;
			if (compound.variants === undefined) continue;

			for (const group of Object.keys(compound.variants)) {
				if (!(group in variants)) variants[group] = {};
				if (!groupsForSlot.includes(group)) groupsForSlot.push(group);
			}
		}

		plans[slotName] = {
			groupsForSlot,
			slotBase: config.slots[slotName],
			variants,
		};
	}

	const targetedSlots = new Set(compoundSlots.flatMap((compound) => compound.slots));
	const targetedPlans = Object.entries(plans)
		.filter(([slotName]) => targetedSlots.has(slotName))
		.map(([, plan]) => plan);

	// CSS source order sets precedence: bases, unconditional compounds, variants, conditional compounds.
	for (const plan of targetedPlans) {
		if (plan.slotBase !== undefined) {
			plan.slotBase = buildStyle(plan.slotBase);
		}
	}

	const unconditionalCompounds = compoundSlots
		.filter(
			(compound) => compound.variants === undefined || Object.keys(compound.variants).length === 0,
		)
		.map((compound) => ({
			...compound,
			style: buildStyle(compound.style),
		}));

	for (const plan of targetedPlans) {
		for (const values of Object.values(plan.variants)) {
			for (const [value, styleRule] of Object.entries(values)) {
				values[value] = buildStyle(styleRule);
			}
		}
	}

	const conditionalCompounds = compoundSlots
		.filter(
			(compound) => compound.variants !== undefined && Object.keys(compound.variants).length > 0,
		)
		.map((compound) => ({
			...compound,
			style: buildStyle(compound.style),
		}));

	// Compose the pre-built classes into each slot's recipe config.
	for (const slotName of slotNames) {
		const plan = plans[slotName];
		if (plan === undefined) continue;

		const { groupsForSlot, slotBase, variants } = plan;
		const compoundVariantsForSlot = conditionalCompounds
			.filter((compound) => compound.slots.includes(slotName))
			.map((compound) => ({ style: compound.style, variants: compound.variants ?? {} }));
		const unconditionalStyles = unconditionalCompounds
			.filter((compound) => compound.slots.includes(slotName))
			.map((compound) => compound.style);

		const defaultVariants = pickGroups(config.defaultVariants, groupsForSlot);

		// A slot an unconditional entry targets had its base pre-built into a class above, so both
		// halves compose as plain class strings here.
		const base =
			unconditionalStyles.length > 0
				? [...(typeof slotBase === 'string' ? [slotBase] : []), ...unconditionalStyles]
				: slotBase;

		slots[slotName] = recipeInRecipesLayer({
			base,
			...(groupsForSlot.length > 0 ? { variants } : {}),
			...(defaultVariants !== undefined && Object.keys(defaultVariants).length > 0
				? { defaultVariants }
				: {}),
			...(compoundVariantsForSlot.length > 0 ? { compoundVariants: compoundVariantsForSlot } : {}),
		});
		slotGroups[slotName] = groupsForSlot;
	}

	return { slotGroups, slots };
}

function buildStyle(styleRule: RecipeStyleRule): string {
	return typeof styleRule === 'string'
		? styleRule
		: vanillaStyle(withLayerIfStyleRule(styleRule) as never);
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
	compoundVariants?: Array<{ variants: Record<string, unknown>; style: RecipeStyleRule }>;
	defaultVariants?: Record<string, unknown>;
	variants?: Record<string, Record<string, RecipeStyleRule>>;
}

function withRecipesLayer(rule: LayeredStyleRule): StyleRule {
	return { '@layer': { [RECIPES_LAYER]: rule } };
}

function isClassNames(part: RecipeStylePart): part is ClassNames {
	return Array.isArray(part) || typeof part === 'string';
}

function withRecipesLayerIfObject(part: RecipeStylePart): RecipeStylePart {
	// Strings and nested class-name arrays are already-built classes; pass through unwrapped.
	return isClassNames(part) ? part : withRecipesLayer(part);
}

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

function isComposedStyle(
	styleRule: RecipeStyleRule,
): styleRule is ReadonlyArray<DistributiveOmit<StyleRule, '@layer'> | ClassNames> {
	return Array.isArray(styleRule);
}

// ---------------------------------------------------------------------------
// Runtime (referenced by the function serializer at import time)
// ---------------------------------------------------------------------------

/** A built Vanilla Extract recipe runtime function (one per slot, or the whole single-part recipe). */
type BuiltRecipe = (selection?: Record<string, unknown>) => string;

/** Serialized descriptor for a slotted recipe: per-slot runtime fns and their variant groups. */
interface SlottedRecipeDescriptor {
	slotGroups: Record<string, ReadonlyArray<string>>;
	slots: Record<string, BuiltRecipe>;
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
 * Splits a recipe input into the variant selection Vanilla Extract's built recipe reads and the
 * consumer `className` appended afterwards. `className` must never reach the built recipe: it
 * would be treated as an unknown variant.
 */
function splitInput(input: Record<string, unknown> | undefined): {
	className: string | undefined;
	selection: Record<string, unknown> | undefined;
} {
	if (input === undefined) return { className: undefined, selection: undefined };
	const { className, ...selection } = input;
	return { className: typeof className === 'string' ? className : undefined, selection };
}

/**
 * Rebuilds a slotted recipe: `recipe(selection)` returns one function per slot,
 * each taking optional composition options. Slots evaluate lazily, so reading one
 * slot does not compute the others.
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
			slots[slotName] = (options) => cx(built(pickGroups(selection, groups)), options?.className);
		}
		return slots;
	};
}

/**
 * Rebuilds a single-part recipe: `recipe(input)` returns the finished class string, with any
 * consumer `className` appended after the recipe's own classes.
 *
 * @public Imported by path string via Vanilla Extract's function serializer, so
 * the reference is invisible to static analysis.
 */
export function createSingleRecipe(built: BuiltRecipe) {
	return (input?: Record<string, unknown>): string => {
		const { className, selection } = splitInput(input);
		return cx(built(selection), className);
	};
}
