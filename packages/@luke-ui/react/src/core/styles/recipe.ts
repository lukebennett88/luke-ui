import type { ComplexStyleRule, StyleRule } from '@vanilla-extract/css';
import { style as vanillaStyle } from '@vanilla-extract/css';
import { addFunctionSerializer } from '@vanilla-extract/css/functionSerializer';
import { recipe as vanillaRecipe } from '@vanilla-extract/recipes';
import { cx } from '../../shared/utils/utils.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import { cascadeLayers } from './layer-names.js';
import type { RecipeComposition } from './recipe-types.js';

export type { RecipeComposition, RecipeSelection } from './recipe-types.js';

/**
 * Builds single-part and slotted recipes. CSS lands in the `recipes` layer.
 *
 * Call with a variant selection. A single-part recipe returns one class string, with an optional
 * consumer `className`. A slotted recipe returns one function per slot, each taking optional
 * `{ className }`.
 *
 * Slotted emission order is base, then unconditional `compoundSlots`, then variants, then
 * conditional `compoundSlots`. Pre-built class names keep their original source position, so slotted
 * styles must be style objects (`SlottedStyleRule`). Single-part recipes still accept pre-built
 * classes.
 *
 * Layer wrapping is inline here. Importing `layered-style.css.ts` would break Vanilla Extract
 * serialization. Runtime rebuild uses `createRecipe` and `createSingleRecipe`.
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

/**
 * Style objects for slotted emission. Pre-built class names keep their source position, so they
 * are rejected here. Single-part recipes still accept them via `RecipeStyleRule`.
 */
type SlottedStyleRule =
	| DistributiveOmit<StyleRule, '@layer'>
	| ReadonlyArray<DistributiveOmit<StyleRule, '@layer'>>;

/** Maps the string variant keys `'true'`/`'false'` onto `boolean` for selection. */
type BooleanMap<T> = T extends 'true' | 'false' ? boolean : T;

/** Variant groups for a single-part recipe: group name to value name to style rule. */
type VariantGroups = Record<string, Record<string, RecipeStyleRule>>;

/** True when there are no authored variant groups (`variants: {}` or missing `variants`). */
type HasNoGroups<Variants> = [keyof Variants] extends [never]
	? true
	: string extends keyof Variants
		? true
		: false;

/** Outer variant selection shared by single-part and slotted recipes. */
type Selection<Variants> =
	HasNoGroups<Variants> extends true
		? Record<string, never>
		: {
				-readonly [Group in keyof Variants]?: BooleanMap<keyof Variants[Group]> | undefined;
			};

/** Variant selection plus optional `className`. */
type RecipeInput<Variants extends VariantGroups> =
	HasNoGroups<Variants> extends true
		? RecipeComposition
		: {
				-readonly [Group in keyof Variants]?: BooleanMap<keyof Variants[Group]> | undefined;
			} & RecipeComposition;

/** A compound variant for a single-part recipe. */
interface CompoundVariant<Variants extends VariantGroups> {
	style: RecipeStyleRule;
	variants: Selection<Variants>;
}

/** Single-part recipe config. */
interface SinglePartConfig<Variants extends VariantGroups> {
	base?: RecipeStyleRule;
	compoundVariants?: Array<CompoundVariant<Variants>>;
	defaultVariants?: Selection<Variants>;
	variants?: Variants;
}

/** The runtime function a single-part `recipe()` returns. */
type SinglePartRecipe<Variants extends VariantGroups> = (input?: RecipeInput<Variants>) => string;

/** A per-slot style map: slot name to style for that slot. */
type SlotStyles<Slot extends string> = Partial<Record<Slot, SlottedStyleRule>>;

/** Variant groups for a slotted recipe: group to value to per-slot styles. */
type SlotVariantGroups<Slot extends string> = Record<string, Record<string, SlotStyles<Slot>>>;

/**
 * Shared style across slots, with an optional variant condition.
 *
 * `NoInfer` keeps `config.slots` / `config.variants` as the inference source so typos error here.
 */
interface CompoundSlot<Slot extends string, Variants extends SlotVariantGroups<Slot>> {
	slots: ReadonlyArray<NoInfer<Slot>>;
	style: SlottedStyleRule;
	variants?: NoInfer<Selection<Variants>>;
}

/** Slotted recipe config. */
interface MultiPartConfig<Slot extends string, Variants extends SlotVariantGroups<Slot>> {
	compoundSlots?: Array<CompoundSlot<Slot, Variants>>;
	defaultVariants?: Selection<Variants>;
	slots: Record<Slot, SlottedStyleRule>;
	variants?: Variants;
}

/** A single slot function: takes optional composition options and returns a class string. */
type SlotFn = (options?: RecipeComposition) => string;

/** The runtime function a slotted `recipe()` returns. */
type MultiPartRecipe<Slot extends string, Variants extends SlotVariantGroups<Slot>> = (
	selection?: Selection<Variants>,
) => Record<Slot, SlotFn>;

/** A raw slotted config as accepted by `recipe`. Internal to this module. */
type AnyMultiPartConfig = MultiPartConfig<string, SlotVariantGroups<string>>;

/**
 * `{ … } as const satisfies SlottedConfigInput` at the definition site keeps literal names and
 * type-checks every style against `StyleRule`.
 */
export interface SlottedConfigInput {
	compoundSlots?: Array<{
		slots: ReadonlyArray<string>;
		style: SlottedStyleRule;
		variants?: Record<string, string | number | boolean>;
	}>;
	defaultVariants?: Record<string, string | number | boolean>;
	slots: Record<string, SlottedStyleRule>;
	variants?: Record<string, Record<string, Record<string, SlottedStyleRule>>>;
}

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
 * Registers a runtime constructor with Vanilla Extract's function serializer. Args include recipe
 * runtime functions the `Serializable` type cannot express, so they are bridged here.
 */
function registerSerializer(fn: object, importName: string, args: ReadonlyArray<unknown>): void {
	addFunctionSerializer(fn, {
		args: args as SerializerArgs,
		importName,
		importPath: SERIALIZER_IMPORT_PATH,
	});
}

/** Adds defaults to a recipe without changing consumer-supplied variant selections. */
export function withDefaultVariants<Input extends object, PublicInput extends Input = Input>(
	recipe: (input?: Input) => string,
	defaults: Input,
): (input?: PublicInput) => string {
	const wrapped = (input?: PublicInput) => {
		const selection = { ...defaults, ...input };
		for (const key in defaults) {
			if (selection[key] === undefined) selection[key] = defaults[key];
		}
		return recipe(selection);
	};

	registerSerializer(wrapped, 'withDefaultVariants', [recipe, defaults]);
	return wrapped;
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
	slotBase: SlottedStyleRule | undefined;
	variants: Record<string, Record<string, SlottedStyleRule>>;
}

/** The same plan once every style it holds has been emitted to a class name. */
interface BuiltSlotPlan {
	groupsForSlot: Array<string>;
	slotBase: string | undefined;
	variants: Record<string, Record<string, string>>;
}

/** A `compoundSlots` entry whose shared style has been emitted to a class name. */
interface BuiltCompoundSlot {
	slots: ReadonlyArray<string>;
	style: string;
	variants?: LayeredVariantSelection;
}

function buildSlottedDescriptor(config: AnyMultiPartConfig): SlottedRecipeDescriptor {
	const slotNames = Object.keys(config.slots);
	const slots: Record<string, BuiltRecipe> = {};
	const slotGroups: Record<string, ReadonlyArray<string>> = {};
	const compoundSlots = config.compoundSlots ?? [];

	// Derive the slot plans before emitting CSS so slot styles precede shared compound styles.
	const plans: Record<string, SlotPlan> = {};
	for (const slotName of slotNames) {
		const variants: Record<string, Record<string, SlottedStyleRule>> = {};
		const groupsForSlot: Array<string> = [];

		if (config.variants !== undefined) {
			for (const [group, values] of Object.entries(config.variants)) {
				const slotValues: Record<string, SlottedStyleRule> = {};
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

	// CSS is emitted as a side effect of `buildStyle`, so the order these four stages run in is
	// what sets precedence: bases, unconditional compounds, variants, conditional compounds. Every
	// slot goes through every stage — pre-building only the slots a `compoundSlots` entry names
	// would leave the rest emitting their bases and variants during assembly below, after all the
	// conditional shared styles, inverting the documented order for them.
	const builtBases = mapValues(plans, (plan) =>
		plan.slotBase === undefined ? undefined : buildStyle(plan.slotBase),
	);

	const unconditionalCompounds = buildCompounds(compoundSlots, isUnconditional);

	const builtVariants = mapValues(plans, (plan) =>
		mapValues(plan.variants, (values) => mapValues(values, buildStyle)),
	);

	const conditionalCompounds = buildCompounds(
		compoundSlots,
		(compound) => !isUnconditional(compound),
	);

	// The three stages above are keyed by slot name off `plans`, so they rejoin per slot here.
	const builtPlans: Record<string, BuiltSlotPlan> = mapValues(plans, (plan, slotName) => ({
		groupsForSlot: plan.groupsForSlot,
		slotBase: builtBases[slotName],
		variants: builtVariants[slotName] ?? {},
	}));

	// Compose the pre-built classes into each slot's recipe config.
	for (const [slotName, plan] of Object.entries(builtPlans)) {
		const { groupsForSlot, slotBase, variants } = plan;
		const compoundVariantsForSlot = conditionalCompounds
			.filter((compound) => compound.slots.includes(slotName))
			.map((compound) => ({ style: compound.style, variants: compound.variants ?? {} }));
		const unconditionalStyles = unconditionalCompounds
			.filter((compound) => compound.slots.includes(slotName))
			.map((compound) => compound.style);

		const defaultVariants = pickGroups(config.defaultVariants, groupsForSlot);

		const base =
			unconditionalStyles.length > 0
				? [...(slotBase === undefined ? [] : [slotBase]), ...unconditionalStyles]
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

/** Rebuilds a record under the same keys, so each stage returns new data rather than mutating. */
function mapValues<In, Out>(
	source: Record<string, In>,
	transform: (value: In, key: string) => Out,
): Record<string, Out> {
	return Object.fromEntries(
		Object.entries(source).map(([key, value]) => [key, transform(value, key)]),
	);
}

function isUnconditional(compound: CompoundSlot<string, SlotVariantGroups<string>>): boolean {
	return compound.variants === undefined || Object.keys(compound.variants).length === 0;
}

/** Emits the shared style of every matching `compoundSlots` entry, in declaration order. */
function buildCompounds(
	compoundSlots: ReadonlyArray<CompoundSlot<string, SlotVariantGroups<string>>>,
	matches: (compound: CompoundSlot<string, SlotVariantGroups<string>>) => boolean,
): Array<BuiltCompoundSlot> {
	return compoundSlots.filter(matches).map((compound) => ({
		slots: compound.slots,
		style: buildStyle(compound.style),
		...(compound.variants === undefined ? {} : { variants: compound.variants }),
	}));
}

function buildStyle(styleRule: RecipeStyleRule): string {
	return typeof styleRule === 'string' ? styleRule : vanillaStyle(withLayerIfStyleRule(styleRule));
}

// ---------------------------------------------------------------------------
// Layer wrapping (wraps every style in the `recipes` layer)
// ---------------------------------------------------------------------------

type LayeredStyleRule = DistributiveOmit<StyleRule, '@layer'>;

const RECIPES_LAYER = cascadeLayers.recipes;

/** Selection shape `vanillaRecipe` sees when the variant map is assembled dynamically. */
type LayeredVariantSelection = Record<string, string | undefined>;

interface RecipeInLayerOptions {
	base?: RecipeStyleRule;
	compoundVariants?: Array<{ variants: LayeredVariantSelection; style: RecipeStyleRule }>;
	defaultVariants?: LayeredVariantSelection;
	variants?: Record<string, Record<string, RecipeStyleRule>>;
}

function withRecipesLayer(rule: LayeredStyleRule): StyleRule {
	return { '@layer': { [RECIPES_LAYER]: rule } };
}

function isClassNames(part: RecipeStylePart): part is ClassNames {
	return Array.isArray(part) || typeof part === 'string';
}

/** Mutable class-name arrays for Vanilla Extract (local `ClassNames` is deeply readonly). */
type VanillaClassNames = string | Array<VanillaClassNames>;

function toVanillaClassNames(names: ClassNames): VanillaClassNames {
	return typeof names === 'string' ? names : toVanillaClassNameArray(names);
}

function toVanillaClassNameArray(names: ReadonlyArray<ClassNames>): Array<VanillaClassNames> {
	return names.map(toVanillaClassNames);
}

function withRecipesLayerIfObject(part: RecipeStylePart): StyleRule | VanillaClassNames {
	// Strings and nested class-name arrays are already-built classes; pass through unwrapped.
	return isClassNames(part) ? toVanillaClassNames(part) : withRecipesLayer(part);
}

/**
 * Wrap style objects in the `recipes` layer. Bare class strings are excluded — they are finished
 * classes, not rules to emit.
 */
function withLayerIfStyleRule(styleRule: Exclude<RecipeStyleRule, string>): ComplexStyleRule {
	// Every array form — composed parts and a nested class-name array alike — goes through the
	// same per-part wrapping, leaving only a lone style object for the direct case.
	return isComposedStyle(styleRule)
		? styleRule.map(withRecipesLayerIfObject)
		: withRecipesLayer(styleRule);
}

/** The same wrapping where a bare class string is allowed, as `vanillaRecipe`'s rules are. */
function withLayerIfStyleRuleOrClass(styleRule: RecipeStyleRule): ComplexStyleRule | string {
	return typeof styleRule === 'string' ? styleRule : withLayerIfStyleRule(styleRule);
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
								withLayerIfStyleRuleOrClass(styleRule),
							]),
						),
					]),
				);

	const layeredCompoundVariants =
		options.compoundVariants === undefined
			? undefined
			: options.compoundVariants.map((compound) => ({
					...compound,
					style: withLayerIfStyleRuleOrClass(compound.style),
				}));

	// `vanillaRecipe`'s generic infers a variant map from a statically-known config. This helper
	// assembles the config dynamically (per slot, with layered rules), so no literal variant map
	// exists to infer from and the result is bridged through the recipe's own runtime contract,
	// `BuiltRecipe`.
	//
	// Each option is listed rather than spread from `options`: a spread would also carry the raw
	// rule at its wider authoring type, alongside the layered replacement.
	const built = vanillaRecipe({
		...(options.defaultVariants === undefined ? {} : { defaultVariants: options.defaultVariants }),
		...(options.base === undefined ? {} : { base: withLayerIfStyleRuleOrClass(options.base) }),
		...(layeredVariants === undefined ? {} : { variants: layeredVariants }),
		...(layeredCompoundVariants === undefined ? {} : { compoundVariants: layeredCompoundVariants }),
	});

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
function pickGroups<Value>(
	selection: Record<string, Value | undefined> | undefined,
	groups: ReadonlyArray<string>,
): Record<string, Value | undefined> | undefined {
	if (selection === undefined) return undefined;

	const picked: Record<string, Value | undefined> = {};
	for (const group of groups) {
		if (group in selection) picked[group] = selection[group];
	}
	return picked;
}

/** Split recipe input into VE selection vs consumer `className` (never pass `className` to VE). */
function splitInput(input: Record<string, unknown> | undefined): {
	className: string | undefined;
	selection: Record<string, unknown> | undefined;
} {
	if (input === undefined) return { className: undefined, selection: undefined };
	const { className, ...selection } = input;
	return { className: typeof className === 'string' ? className : undefined, selection };
}

/**
 * Runtime rebuild for a slotted recipe. Slots evaluate lazily.
 *
 * @public Path-imported by Vanilla Extract's function serializer.
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
 * Runtime rebuild for a single-part recipe. Appends consumer `className` after recipe classes.
 *
 * @public Path-imported by Vanilla Extract's function serializer.
 */
export function createSingleRecipe(built: BuiltRecipe) {
	return (input?: Record<string, unknown>): string => {
		const { className, selection } = splitInput(input);
		return cx(built(selection), className);
	};
}
