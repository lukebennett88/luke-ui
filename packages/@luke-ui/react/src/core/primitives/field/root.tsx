import type { ComponentProps, JSX } from 'react';
import type { XStyleProp } from '../../styles/xstyle.js';
import { resolveXStyleProps } from '../../styles/xstyle.js';
import { resolveFieldRecipeStyles } from './recipe.js';

interface FieldRootStyleProps {
	/**
	 * Extra styles as one or more `stylex.create(...)` objects. Applied after `Field`'s own styles
	 * and before `className`. A same-property `xstyle` value wins over those styles. A consumer
	 * `className` still beats `xstyle`, and inline `style` beats `className`.
	 */
	xstyle?: XStyleProp;
}

/** Props for the primitive field container. */
export type FieldRootProps = ComponentProps<'div'> & FieldRootStyleProps;

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
