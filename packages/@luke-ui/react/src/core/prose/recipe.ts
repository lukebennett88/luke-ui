import { cx } from '../../shared/utils/utils.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { recipe } from '../styles/stylex-recipe.js';
import { proseScopeClassName } from './scope.js';

// Prose's only styles are the approved structural descendant rules in `styles.css.ts`. The recipe
// still uses the StyleX recipe adapter so its public string-returning API stays uniform.
const stylexRecipe = recipe({});

/** Recipe for a fixed long-form document rhythm. */
export const proseRecipe = () => cx(stylexRecipe(), proseScopeClassName);

export type ProseRecipeVariants = RecipeSelection<typeof proseRecipe>;
