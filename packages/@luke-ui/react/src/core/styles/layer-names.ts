/**
 * Cascade layer names, ordered from lowest to highest priority.
 *
 * Keep this as a plain `.ts` module. Importing these names from `layers.css.ts` would turn that
 * file into a Vanilla Extract boundary and re-emit its `@layer` declarations. The array order is
 * precedence when `layers.css.ts` calls `globalLayer()`. Do not replace the array with an
 * unordered object as the primary export.
 */
export const cascadeLayerNames = [
	'reset',
	'theme',
	'base',
	'recipes',
	'structural',
	'utilities',
] as const;

export type CascadeLayerName = (typeof cascadeLayerNames)[number];

/** Lookup by name, for example `cascadeLayers.recipes`. */
export const cascadeLayers = Object.fromEntries(cascadeLayerNames.map((name) => [name, name])) as {
	[Name in CascadeLayerName]: Name;
};
