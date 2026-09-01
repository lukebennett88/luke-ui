import type { ComponentProps } from 'react';
import type { XStyleProp } from '../styles/xstyle.js';
import { resolveXStyleClassName } from '../styles/xstyle.js';
import type { Prettify } from '../types/prettify.js';
import { codeRecipe } from './recipe.js';

interface _CodeProps extends ComponentProps<'code'> {
	/**
	 * Escape hatch for styling properties `Code`'s own styles do not set, as one or more
	 * `stylex.create(...)` style objects. Applied after `Code`'s own styles and before `className`,
	 * so a consumer `className` still beats it.
	 */
	xstyle?: XStyleProp;
}

/** Props for the `Code` component. */
export type CodeProps = Prettify<_CodeProps>;

/**
 * Marks a short fragment of computer code, rendered as `<code>`.
 */
export function Code(props: CodeProps) {
	const { className, xstyle, ...elementProps } = props;
	return (
		<code {...elementProps} className={resolveXStyleClassName(codeRecipe(), xstyle, className)} />
	);
}
