/**
 * The single source of truth for cascade layer names, ordered from lowest to highest priority.
 *
 * This is a plain `.ts` module rather than a `.css.ts` one on purpose: `layers.css.ts` calls
 * `globalLayer()` per name, which is a Vanilla Extract build-time side effect that emits `@layer`
 * declarations. `recipe.ts` and `vite.config.ts` need the name list too, but neither should import
 * a `.css.ts` module — doing so would turn `layers.css.ts` into a Vanilla Extract serialization
 * boundary and re-emit its `@layer` declarations a second time. Keeping the names here, in a
 * module with no Vanilla Extract calls, lets all three consumers import the same literal values
 * with no build-time side effects attached.
 *
 * The tuple's order is what establishes cascade precedence when `layers.css.ts` maps it through
 * `globalLayer()` in order, so this array — not any object built from it — is the source of
 * truth. Do not replace it with an unordered object as the primary export.
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

/**
 * Named lookup derived from `cascadeLayerNames`. Prefer this when a consumer needs one layer by
 * identity (for example `cascadeLayers.recipes`) rather than by position in the ordered tuple.
 */
export const cascadeLayers = Object.fromEntries(cascadeLayerNames.map((name) => [name, name])) as {
	[Name in CascadeLayerName]: Name;
};
