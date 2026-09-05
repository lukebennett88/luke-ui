import type { ComponentProps } from 'react';
import { cx } from '../../shared/utils/utils.js';
import type { XStyleProps } from '../styles/xstyle.js';
import type { Prettify } from '../types/prettify.js';
import { codeRecipe } from './recipe.js';

interface _CodeProps extends ComponentProps<'code'>, XStyleProps {}

/** Props for the `Code` component. */
export type CodeProps = Prettify<_CodeProps>;

/**
 * Marks a short fragment of computer code, rendered as `<code>`.
 */
export function Code(props: CodeProps) {
	const { className, style, xstyle, ...elementProps } = props;
	const recipeProps = codeRecipe({ xstyle });

	return (
		<code
			{...elementProps}
			{...recipeProps}
			className={cx(recipeProps.className, className)}
			style={recipeProps.style === undefined ? style : { ...recipeProps.style, ...style }}
		/>
	);
}
