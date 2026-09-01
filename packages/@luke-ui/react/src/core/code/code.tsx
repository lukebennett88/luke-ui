import type { ComponentProps } from 'react';
import type { XStyleProp } from '../styles/xstyle.js';
import { resolveXStyleProps } from '../styles/xstyle.js';
import type { Prettify } from '../types/prettify.js';
import { resolveCodeRecipeStyles } from './recipe.js';

interface _CodeProps extends ComponentProps<'code'> {
	/**
	 * Extra styles as one or more `stylex.create(...)` objects. Applied after `Code`'s own styles
	 * and before `className`. A same-property `xstyle` value wins over those styles. A consumer
	 * `className` still beats `xstyle`, and inline `style` beats `className`.
	 */
	xstyle?: XStyleProp;
}

/** Props for the `Code` component. */
export type CodeProps = Prettify<_CodeProps>;

/**
 * Marks a short fragment of computer code, rendered as `<code>`.
 */
export function Code(props: CodeProps) {
	const { className, style, xstyle, ...elementProps } = props;
	const stylexProps = resolveXStyleProps(resolveCodeRecipeStyles(), xstyle, className, style);
	return <code {...elementProps} {...stylexProps} />;
}
