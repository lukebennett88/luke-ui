/**
 * Recipe runtime. Vanilla Extract's function serializer imports these constructors from
 * `#recipe-engine`, which Vite aliases here and pack bundles as a relative chunk. This module is not
 * a public package subpath.
 *
 * Every component imports this module at runtime, so it must not import Vanilla Extract or other
 * styling-authoring code. Authoring lives in `recipe.ts`.
 */
import { cx } from '../../shared/utils/utils.js';
import type { RecipeComposition } from './recipe-types.js';

/** A built Vanilla Extract recipe runtime function (one per slot, or the whole single-part recipe). */
export type BuiltRecipe = (selection?: Record<string, unknown>) => string;

/** A single slot function: takes optional composition options and returns a class string. */
export type SlotFn = (options?: RecipeComposition) => string;

/** Serialized descriptor for a slotted recipe: per-slot runtime fns and their variant groups. */
export interface SlottedRecipeDescriptor {
	slotGroups: Record<string, ReadonlyArray<string>>;
	slots: Record<string, BuiltRecipe>;
}

/** Narrows an outer selection to the variant groups a given slot actually uses. */
export function pickGroups<Value>(
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

/**
 * Runtime rebuild for `withDefaultVariants`. Fills each default the input leaves `undefined`, then
 * calls the wrapped recipe. The authoring wrapper in `recipe.ts` type-checks the defaults.
 *
 * @public Path-imported by Vanilla Extract's function serializer.
 */
export function withDefaultVariants<Input extends object, PublicInput extends Input = Input>(
	recipe: (input?: Input) => string,
	defaults: Input,
): (input?: PublicInput) => string {
	return (input?: PublicInput) => {
		const selection = { ...defaults, ...input };
		for (const key in defaults) {
			if (selection[key] === undefined) selection[key] = defaults[key];
		}
		return recipe(selection);
	};
}
