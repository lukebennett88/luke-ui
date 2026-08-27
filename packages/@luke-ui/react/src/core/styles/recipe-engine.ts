/**
 * Runtime serializer target for colocated recipes. Vite graphs alias `#recipe-engine` here; pack
 * bundles a relative chunk. This module is not a public package subpath.
 */
export { createRecipe, createSingleRecipe } from './recipe.js';
