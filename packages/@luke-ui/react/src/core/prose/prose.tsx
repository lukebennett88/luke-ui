import type { ComponentProps, JSX } from 'react';
import { cx } from '../../shared/utils/utils.js';
import { proseRecipe } from './recipe.css.js';

/** Props for `Prose`. */
export interface ProseProps extends ComponentProps<'div'> {}

/**
 * Applies a fixed vertical rhythm and document list structure to long-form content, rendered as a
 * `<div>`. Wrap markup you do not author element by element, such as rendered Markdown, MDX, or the
 * output of a content management system.
 *
 * `Prose` owns document structure and spacing between blocks, not typography or visual hierarchy.
 * It sets no font, size, weight, text colour, or width, and adds no spacing outside itself. Raw
 * headings and paragraphs keep default text styles unless wrapped in components that own them. Its
 * rules carry zero specificity, so a plain class on any element inside overrides them.
 */
export function Prose(props: ProseProps): JSX.Element {
	const { className, ...divProps } = props;
	return <div {...divProps} className={cx(proseRecipe(), className)} />;
}
