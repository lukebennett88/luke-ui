import * as stylex from '@stylexjs/stylex';
import { lukeUiClassNames } from '../../shared/class-names.js';
import { cx } from '../../shared/utils/utils.js';
import type { RecipeProps } from '../styles/recipe-authoring.js';
import type { XStyleProp } from '../styles/xstyle.js';

/** Selection accepted by `proseRecipe`. Prose declares no variants. */
interface ProseRecipeSelection {
	/** Extra `stylex.create(...)` styles for properties not exposed by the component. */
	xstyle?: XStyleProp;
}

/**
 * Recipe for a fixed long-form document rhythm.
 *
 * Prose has no StyleX styles of its own: its rhythm is the approved structural descendant rules in
 * `styles.css.ts`, which a scope class selects. So this recipe adds that class directly rather
 * than routing an empty style set through the authoring factory, and still resolves a consumer
 * `xstyle` the way every other recipe does.
 */
export function proseRecipe(selection: ProseRecipeSelection = {}): RecipeProps {
	const resolved = stylex.props(selection.xstyle);
	return { ...resolved, className: cx(lukeUiClassNames.proseScope, resolved.className) };
}

/** Variant type for the `Prose` recipe. */
export type ProseRecipeVariants = Omit<ProseRecipeSelection, 'xstyle'>;
