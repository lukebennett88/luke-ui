import type { ComponentProps, JSX } from 'react';
import { cx } from '../../shared/utils/utils.js';
import type { XStyleProp } from '../styles/xstyle.js';
import { resolveXStyleProps } from '../styles/xstyle.js';
import { resolveProseRecipeStyles } from './recipe.js';
import { proseScopeClassName } from './scope.js';

/** Props for `Prose`. */
export interface ProseProps extends ComponentProps<'div'> {
	/**
	 * Extra styles as one or more `stylex.create(...)` objects. Applied after `Prose`'s own styles
	 * and before `className`. A same-property `xstyle` value wins over those styles. A consumer
	 * `className` still beats `xstyle`, and inline `style` beats `className`.
	 */
	xstyle?: XStyleProp;
}

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
			className={cx(proseScopeClassName, stylexProps.className, className)}
		/>
	);
}
