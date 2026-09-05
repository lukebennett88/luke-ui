import type { ComponentProps, JSX } from 'react';
import { cx } from '../../shared/utils/utils.js';
import type { XStyleProps } from '../styles/xstyle.js';
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

	return (
		<div
			{...divProps}
			{...recipeProps}
			className={cx(recipeProps.className, className)}
			style={recipeProps.style === undefined ? style : { ...recipeProps.style, ...style }}
		/>
	);
}
