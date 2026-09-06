import type { ComponentProps } from 'react';
import type { Prettify } from '../types/prettify.js';
import { codeRecipe } from './recipe.css.js';

interface _CodeProps extends ComponentProps<'code'> {}

/** Props for the `Code` component. */
export type CodeProps = Prettify<_CodeProps>;

/**
 * Marks a short fragment of computer code, rendered as `<code>`.
 */
export function Code(props: CodeProps) {
	const { className, ...elementProps } = props;
	return <code {...elementProps} className={codeRecipe({ className })} />;
}
