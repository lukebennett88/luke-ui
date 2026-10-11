/**
 * Cascade layer names. Keep this a plain `.ts` module: importing these names from `layers.css.ts`
 * would make that file a Vanilla Extract boundary and re-emit its `@layer` declarations.
 */

/** Layer names inside the top-level `luke-ui` layer. Array order is precedence, lowest first. */
export const lukeUiLayerNames = ['reset', 'recipes', 'utilities'] as const;

/** The dotted layer name for each Luke UI layer, for example `luke-ui.reset`. */
export const cascadeLayers = Object.fromEntries(
	lukeUiLayerNames.map((name) => [name, `luke-ui.${name}`]),
) as { [Name in (typeof lukeUiLayerNames)[number]]: `luke-ui.${Name}` };

/**
 * The order statement the build puts at the start of the public stylesheet, so nothing in it can
 * create a layer earlier. `base` belongs to the consuming application, for example Tailwind
 * Preflight. Declaring it here ranks it below `luke-ui`. Luke UI never writes to it.
 */
export const cascadeLayerOrder = `@layer base, luke-ui;
@layer luke-ui {
  @layer ${lukeUiLayerNames.join(', ')};
}`;
