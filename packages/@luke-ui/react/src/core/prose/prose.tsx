import type { ComponentProps, JSX } from 'react';
import type { XStyleProp } from '../styles/xstyle.js';
import { resolveXStyleClassName } from '../styles/xstyle.js';
import { proseRecipe } from './recipe.js';

/** Props for `Prose`. */
export interface ProseProps extends ComponentProps<'div'> {
	/**
	 * Escape hatch for styling properties `Prose`'s own styles do not set, as one or more
	 * `stylex.create(...)` style objects. Applied after `Prose`'s own styles and before
	 * `className`, so a consumer `className` still beats it.
	 */
	xstyle?: XStyleProp;
}

/**
 * Adds vertical rhythm and list styling to long-form content such as rendered Markdown, MDX, or
 * CMS content. Pair it with Luke UI typography components for visual hierarchy.
 */
export function Prose(props: ProseProps): JSX.Element {
	const { className, xstyle, ...divProps } = props;
	return <div {...divProps} className={resolveXStyleClassName(proseRecipe(), xstyle, className)} />;
}
