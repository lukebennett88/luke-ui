import type { ComponentProps, JSX } from 'react';
import type { XStyleProps } from '../../styles/xstyle.js';
import { resolveXStyleProps } from '../../styles/xstyle.js';
import { resolveFieldRecipeStyles } from './recipe.js';

/** Props for the primitive field container. */
export type FieldRootProps = ComponentProps<'div'> & XStyleProps;

/** Simple wrapper used by field primitives. */
export function Field(props: FieldRootProps): JSX.Element {
	const { className, style, xstyle, ...restProps } = props;

	return (
		<div
			{...restProps}
			{...resolveXStyleProps(resolveFieldRecipeStyles().root, xstyle, className, style)}
		/>
	);
}
