// This module must stay free of style rules: it exists solely so the reset can depend on the
// Prose scope class without evaluating the Prose global-rule set in `recipe.css.ts`.
import { styleInLayer } from '../styles/layered-style.css.js';

/**
 * The Prose scope class. Every Prose rule in `recipe.css.ts` is scoped to it, and `proseRecipe()`
 * applies it as its base class so `<Prose>` and recipe-only usage scope identically. It lives
 * apart from `recipe.css.ts` so the reset can depend on the class without evaluating the Prose
 * global-rule set as a side effect of the import.
 */
export const proseScopeClassName = styleInLayer('recipes', {}, 'prose');
