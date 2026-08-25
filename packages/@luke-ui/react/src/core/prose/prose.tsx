import type { ComponentProps, JSX } from 'react';
import { cx } from '../../shared/utils/utils.js';
import { proseRecipe } from './recipe.css.js';

/** Props for `Prose`. */
export interface ProseProps extends ComponentProps<'div'> {}

/**
 * Applies vertical rhythm and list structure to a block of long-form content, rendered as a
 * `<div>`. Wrap markup you do not author element by element, such as the output of MDX or a
 * content management system, and its headings, paragraphs, lists, tables, and rules space
 * themselves.
 *
 * `Prose` styles block layout only. Font, size, weight, and colour still come from the
 * components that own them, so a Luke UI component inside it keeps its own appearance.
 */
export function Prose(props: ProseProps): JSX.Element {
	const { className, ...divProps } = props;
	return <div {...divProps} className={cx(proseRecipe(), className)} />;
}
