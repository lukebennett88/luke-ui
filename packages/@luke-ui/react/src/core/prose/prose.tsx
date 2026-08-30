import type { ComponentProps, JSX } from 'react';
import { cx } from '../../shared/utils/utils.js';
import { proseRecipe } from './recipe.css.js';

/** Props for `Prose`. */
export interface ProseProps extends ComponentProps<'div'> {}

/**
 * Adds vertical rhythm and list styling to long-form content such as rendered Markdown, MDX, or
 * CMS content. Pair it with Luke UI typography components for visual hierarchy.
 */
export function Prose(props: ProseProps): JSX.Element {
	const { className, ...divProps } = props;
	return <div {...divProps} className={cx(proseRecipe(), className)} />;
}
