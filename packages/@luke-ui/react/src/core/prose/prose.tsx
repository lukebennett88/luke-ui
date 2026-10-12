import type { ComponentProps, JSX } from 'react';
import { proseRecipe } from './recipe.css.js';

/** Props for `Prose`. */
export interface ProseProps extends ComponentProps<'div'> {}

/**
 * Styles long-form content such as rendered Markdown, MDX, or CMS content. Plain headings and
 * paragraphs get the same type styles as `Heading` and `Text`, and Prose spaces the blocks and
 * styles lists, code blocks, tables, rules, and media.
 *
 * Add the `not-prose` class to an element to keep Prose styling off it and everything inside it. A
 * `Prose` nested inside that element applies again.
 */
export function Prose(props: ProseProps): JSX.Element {
	const { className, ...divProps } = props;
	return <div {...divProps} className={proseRecipe({ className })} />;
}
