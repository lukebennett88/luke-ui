import type { ComponentProps, JSX } from 'react';
import type { XStyleProps } from '../styles/xstyle.js';
import { composeRecipeProps } from '../styles/xstyle.js';
import { proseRecipe } from './recipe.js';

/** Props for `Prose`. */
export interface ProseProps extends ComponentProps<'div'>, XStyleProps {}

/**
 * Adds vertical rhythm and list styling to long-form content such as rendered Markdown, MDX, or
 * CMS content. Pair it with Luke UI typography components for visual hierarchy.
 */
export function Prose(props: ProseProps): JSX.Element {
	const { className, style, xstyle, ...divProps } = props;
	const recipeProps = proseRecipe({ xstyle });

	return <div {...divProps} {...composeRecipeProps(recipeProps, className, style)} />;
}
