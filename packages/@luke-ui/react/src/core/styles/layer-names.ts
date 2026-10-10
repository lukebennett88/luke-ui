/**
 * Cascade layer names.
 *
 * Keep this as a plain `.ts` module. Importing these names from `layers.css.ts` would turn that
 * file into a Vanilla Extract boundary and re-emit its `@layer` declarations.
 */

/** The top-level layer every Luke UI layer sits in. */
export const lukeUiLayerName = 'luke-ui';

/**
 * Top-level layers, from lowest to highest priority. `base` is reserved for the consuming
 * application, for example Tailwind Preflight. Luke UI declares it so it ranks below `luke-ui`, and
 * never writes to it.
 */
export const topLevelLayerNames = ['base', lukeUiLayerName] as const;

/** Layers inside `luke-ui`, from lowest to highest priority. */
export const lukeUiSublayerNames = ['reset', 'recipes', 'utilities'] as const;

export type LukeUiSublayerName = (typeof lukeUiSublayerNames)[number];

/** Full layer names by sublayer, for example `cascadeLayers.recipes` is `luke-ui.recipes`. */
export const cascadeLayers = Object.fromEntries(
	lukeUiSublayerNames.map((name) => [name, `${lukeUiLayerName}.${name}`]),
) as { [Name in LukeUiSublayerName]: `${typeof lukeUiLayerName}.${Name}` };

/**
 * The order statement the build puts at the start of the public stylesheet. It is the only
 * statement that creates layers, so nothing in the stylesheet can create one earlier.
 */
export const cascadeLayerOrder = [
	`@layer ${topLevelLayerNames.join(', ')};`,
	`@layer ${lukeUiLayerName} {`,
	`  @layer ${lukeUiSublayerNames.join(', ')};`,
	'}',
].join('\n');
