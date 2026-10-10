/**
 * Cascade layer names. Keep this a plain `.ts` module: importing these names from `layers.css.ts`
 * would make that file a Vanilla Extract boundary and re-emit its `@layer` declarations.
 */

/** Luke UI's layers, from lowest to highest priority, all inside the top-level `luke-ui` layer. */
export const cascadeLayers = {
	reset: 'luke-ui.reset',
	recipes: 'luke-ui.recipes',
	utilities: 'luke-ui.utilities',
} as const;

/**
 * The order statement the build puts at the start of the public stylesheet, so nothing in it can
 * create a layer earlier. `base` belongs to the consuming application, for example Tailwind
 * Preflight. Declaring it here ranks it below `luke-ui`. Luke UI never writes to it.
 */
export const cascadeLayerOrder = `@layer base, luke-ui;
@layer luke-ui {
  @layer reset, recipes, utilities;
}`;
