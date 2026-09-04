import { lukeUiClassNames } from '../../shared/class-names.js';
import { cx } from '../../shared/utils/utils.js';
import type { RecipeProps, RecipeSelection } from '../styles/stylex-recipe.js';
import { createRecipe, createRecipeStyles } from '../styles/stylex-recipe.js';

// Prose's only styles are the approved structural descendant rules in `styles.css.ts`. The recipe
// still uses the StyleX recipe adapter so its public props-returning API stays uniform.
export const resolveProseRecipeStyles = createRecipeStyles({});

const stylexRecipe = createRecipe(resolveProseRecipeStyles);

/** Recipe for a fixed long-form document rhythm. */
export function proseRecipe(): RecipeProps {
	const resolved = stylexRecipe();
	return { ...resolved, className: cx(resolved.className, lukeUiClassNames.proseScope) };
}

export type ProseRecipeVariants = RecipeSelection<typeof resolveProseRecipeStyles>;
