import type { ComponentProps, JSX } from 'react';
import { lukeUiClassNames } from '../../shared/class-names.js';
import { cx } from '../../shared/utils/utils.js';
import type { XStyleProps } from '../styles/xstyle.js';
import { resolveXStyleProps } from '../styles/xstyle.js';
import { resolveProseRecipeStyles } from './recipe.js';

/** Props for `Prose`. */
export interface ProseProps extends ComponentProps<'div'>, XStyleProps {}

/**
 * Adds vertical rhythm and list styling to long-form content such as rendered Markdown, MDX, or
 * CMS content. Pair it with Luke UI typography components for visual hierarchy.
 */
export function Prose(props: ProseProps): JSX.Element {
	const { className, style, xstyle, ...divProps } = props;
	const stylexProps = resolveXStyleProps(resolveProseRecipeStyles(), xstyle, undefined, style);
	return (
		<div
			{...divProps}
			{...stylexProps}
			className={cx(lukeUiClassNames.proseScope, stylexProps.className, className)}
		/>
	);
}
