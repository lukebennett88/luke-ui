/** Authoring types and runtime helpers for the recipe Babel transform. */

import type { CompiledStyles } from '@stylexjs/stylex';
import * as stylex from '@stylexjs/stylex';
import type { XStyleProp } from './xstyle.js';

type StyleXStyle = CompiledStyles;

type AuthoredStyle = Parameters<typeof stylex.create>[0][string];

type StyleEntry = AuthoredStyle | StyleXStyle | ReadonlyArray<AuthoredStyle | StyleXStyle>;

type OptionalStyleEntry = StyleEntry | null;

/** Marks one imported compiled StyleX style for the recipe authoring transform. */
export function compiledStyle<const Style extends CompiledStyles>(value: Style): Style {
	return value;
}

/** Marks an ordered array of imported compiled StyleX styles for the recipe authoring transform. */
export function compiledStyleList<const Styles extends ReadonlyArray<CompiledStyles>>(
	values: Styles,
): Styles {
	return values;
}

type VariantGroups = Record<string, Record<string, OptionalStyleEntry>>;

type SlotStyles<Slot extends string> = Partial<Record<Slot, OptionalStyleEntry>>;

type SlotVariantGroups<Slot extends string> = Record<
	string,
	Record<string, SlotStyles<Slot> | null>
>;

/** The variant map for a recipe without variants. */
type NoVariants = Record<never, never>;

type BooleanMap<T> = T extends 'true' | 'false' ? boolean : T;

/** Use a closed record when no groups exist so unknown keys remain errors. */
type VariantSelection<Variants> = [keyof Variants] extends [never]
	? Record<string, never>
	: {
			-readonly [Group in keyof Variants]?: BooleanMap<keyof Variants[Group]> | undefined;
		};

/** Keep `xstyle` valid for base-only recipes while rejecting other keys. */
type RecipeCallArgument<Variants, Override> = [keyof Variants] extends [never]
	? ({ xstyle?: Override } & Record<string, never>) | { xstyle?: Override }
	: VariantSelection<Variants> & { xstyle?: Override };

/** A compound variant for a single-part recipe. */
type CompoundVariant<Variants> = VariantSelection<Variants> & { style: StyleEntry };

type SlotCompoundVariant<Slot extends string, Variants> = VariantSelection<Variants> & {
	style: SlotStyles<Slot>;
};

interface SinglePartConfig<Variants extends VariantGroups> {
	base?: StyleEntry;
	compoundVariants?: ReadonlyArray<CompoundVariant<Variants>>;
	defaultVariants?: VariantSelection<Variants>;
	variants?: Variants;
}

interface SlottedConfig<Slot extends string, Variants extends SlotVariantGroups<Slot>> {
	compoundVariants?: ReadonlyArray<SlotCompoundVariant<Slot, Variants>>;
	defaultVariants?: VariantSelection<Variants>;
	slots: Record<Slot, StyleEntry>;
	variants?: Variants;
}

/** The spreadable output of `stylex.props(...)`. */
export type RecipeProps = ReturnType<typeof stylex.props>;

/** Callable single-part recipe. */
export type SinglePartRecipe<Variants> = (
	selection?: RecipeCallArgument<Variants, XStyleProp>,
) => RecipeProps;

/** Callable slotted recipe. */
export type SlottedRecipe<Slot extends string, Variants> = (
	selection?: RecipeCallArgument<Variants, Partial<Record<Slot, XStyleProp>>>,
) => Record<Slot, RecipeProps>;

/** Derives a built recipe's variant selection without its `xstyle` key. */
export type RecipeSelection<Recipe> =
	Recipe extends SlottedRecipe<string, infer Variants>
		? VariantSelection<Variants>
		: Recipe extends SinglePartRecipe<infer Variants>
			? VariantSelection<Variants>
			: never;

/** Declares a recipe. Inline styles are lowered into `stylex.create` at build time. */
export function recipe<
	const Slot extends string,
	const Variants extends SlotVariantGroups<Slot> = NoVariants,
>(config: SlottedConfig<Slot, Variants>): SlottedRecipe<Slot, Variants>;
export function recipe<const Variants extends VariantGroups = NoVariants>(
	config: SinglePartConfig<Variants>,
): SinglePartRecipe<Variants>;
export function recipe(): never {
	throw new Error(
		'recipe() was called at runtime. It must be expanded by the Luke UI recipe authoring Babel transform, which runs before @stylexjs/babel-plugin. See stylex-vite-plugin.ts.',
	);
}

type CompiledStyleEntry =
	| { key: string; tag: 'key' }
	| { ref: StyleXStyle; tag: 'ref' }
	| { ref: ReadonlyArray<StyleXStyle>; tag: 'refs' }
	| { entries: ReadonlyArray<CompiledStyleEntry>; tag: 'list' };

interface CompiledVariantGroup<Value> {
	group: string;
	values: Record<string, Value>;
}

interface CompiledCompound<Style> {
	conditions: Selection;
	style: Style;
}

export interface CompiledRecipeMapping {
	base: ReadonlyArray<CompiledStyleEntry>;
	compoundVariants: ReadonlyArray<CompiledCompound<CompiledStyleEntry>>;
	defaultVariants: Selection;
	variants: ReadonlyArray<CompiledVariantGroup<CompiledStyleEntry | null>>;
}

export interface CompiledSlottedRecipeMapping {
	base: Record<string, ReadonlyArray<CompiledStyleEntry>>;
	compoundVariants: ReadonlyArray<CompiledCompound<Record<string, CompiledStyleEntry | null>>>;
	defaultVariants: Selection;
	slotNames: ReadonlyArray<string>;
	variants: ReadonlyArray<CompiledVariantGroup<Record<string, CompiledStyleEntry | null> | null>>;
}

type CompiledStyleMap = Record<string, StyleXStyle>;

type SelectedValue = boolean | number | string | undefined;

type Selection = Record<string, SelectedValue>;

type RecipeCall = Record<string, unknown> & { xstyle?: unknown };

/** Build the runtime for a single-part recipe. */
export function recipeFromCompiled(
	compiledStyles: CompiledStyleMap,
	mapping: CompiledRecipeMapping,
): (selection?: RecipeCall) => RecipeProps {
	return (selection) => {
		const { variantSelection, xstyle } = splitSelection(selection);
		const styles = resolveStyles(compiledStyles, mapping, variantSelection);
		return stylex.props(...styles, xstyle as StyleXStyle | undefined);
	};
}

/** Build the runtime for a slotted recipe. */
export function slottedRecipeFromCompiled(
	compiledStyles: CompiledStyleMap,
	mapping: CompiledSlottedRecipeMapping,
): (selection?: RecipeCall) => Record<string, RecipeProps> {
	const resolveSlot = (
		slotName: string,
		selection: Selection,
		xstyle?: XStyleProp,
	): RecipeProps => {
		return stylex.props(...resolveSlotStyles(compiledStyles, mapping, slotName, selection), xstyle);
	};
	const built = (selection?: RecipeCall): Record<string, RecipeProps> => {
		const { variantSelection, xstyle } = splitSelection(selection);
		const xstyleBySlot = (xstyle ?? {}) as Record<string, XStyleProp>;
		const slots: Record<string, RecipeProps> = {};
		for (const slotName of mapping.slotNames) {
			slots[slotName] = resolveSlot(slotName, variantSelection, xstyleBySlot[slotName]);
		}
		return slots;
	};
	slotResolvers.set(built, resolveSlot);
	return built;
}

const slotResolvers = new WeakMap<
	object,
	(slotName: string, selection: Selection, xstyle?: XStyleProp) => RecipeProps
>();

/** Resolve one slot without building the other slots. */
export function resolveRecipeSlotProps<
	Recipe extends (...args: Array<never>) => Record<string, RecipeProps>,
>(
	built: Recipe,
	slotName: keyof ReturnType<Recipe> & string,
	selection?: RecipeSelection<Recipe>,
	xstyle?: XStyleProp,
): RecipeProps {
	const resolveSlot = slotResolvers.get(built);
	if (resolveSlot === undefined) throw new Error('Expected a compiled slotted recipe.');
	return resolveSlot(slotName, selection ?? {}, xstyle);
}

/** Split variant selections from `xstyle`. */
function splitSelection(selection: RecipeCall | undefined): {
	variantSelection: Selection;
	xstyle: unknown;
} {
	if (selection === undefined) return { variantSelection: {}, xstyle: undefined };
	const { xstyle, ...variantSelection } = selection;
	return { variantSelection: variantSelection as Selection, xstyle };
}

/** Resolve base, variants, then matching compounds. */
function resolveStyles(
	compiledStyles: CompiledStyleMap,
	mapping: CompiledRecipeMapping,
	selection: Selection,
): Array<StyleXStyle> {
	const selected = { ...mapping.defaultVariants, ...withoutUndefined(selection) };
	const styles: Array<StyleXStyle> = [];

	for (const entry of mapping.base) pushStyleEntry(entry, compiledStyles, styles);

	for (const { group, values } of mapping.variants) {
		const chosen = selected[group];
		if (chosen === undefined) continue;
		pushStyleEntry(values[String(chosen)], compiledStyles, styles);
	}

	for (const compound of mapping.compoundVariants) {
		if (!matchesConditions(compound.conditions, selected)) continue;
		pushStyleEntry(compound.style, compiledStyles, styles);
	}

	return styles;
}

/** Resolve styles for one slot. */
function resolveSlotStyles(
	compiledStyles: CompiledStyleMap,
	mapping: CompiledSlottedRecipeMapping,
	slotName: string,
	selection: Selection,
): Array<StyleXStyle> {
	const selected = { ...mapping.defaultVariants, ...withoutUndefined(selection) };
	const styles: Array<StyleXStyle> = [];

	for (const entry of mapping.base[slotName] ?? []) {
		pushStyleEntry(entry, compiledStyles, styles);
	}

	for (const { group, values } of mapping.variants) {
		const chosen = selected[group];
		if (chosen === undefined) continue;
		const perSlot = values[String(chosen)];
		if (perSlot == null) continue;
		pushStyleEntry(perSlot[slotName], compiledStyles, styles);
	}

	for (const compound of mapping.compoundVariants) {
		if (!matchesConditions(compound.conditions, selected)) continue;
		pushStyleEntry(compound.style[slotName], compiledStyles, styles);
	}

	return styles;
}

function matchesConditions(conditions: Selection, selected: Selection): boolean {
	return Object.entries(conditions).every(
		([group, value]) => String(selected[group]) === String(value),
	);
}

/** Remove explicit `undefined` values before applying defaults. */
function withoutUndefined(selection: Selection): Selection {
	const defined: Selection = {};
	for (const [group, value] of Object.entries(selection)) {
		if (value !== undefined) defined[group] = value;
	}
	return defined;
}

/** Append one mapping entry's styles in order. */
function pushStyleEntry(
	entry: CompiledStyleEntry | null | undefined,
	compiledStyles: CompiledStyleMap,
	styles: Array<StyleXStyle>,
): void {
	if (entry == null) return;

	if (entry.tag === 'key') {
		const style = compiledStyles[entry.key];
		if (style !== undefined) styles.push(style);
		return;
	}

	if (entry.tag === 'ref') {
		styles.push(entry.ref);
		return;
	}

	if (entry.tag === 'refs') {
		styles.push(...entry.ref);
		return;
	}

	for (const child of entry.entries) pushStyleEntry(child, compiledStyles, styles);
}
