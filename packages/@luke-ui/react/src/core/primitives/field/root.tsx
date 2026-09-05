import type { ComponentProps, JSX } from 'react';
import type { XStyleProps } from '../../styles/xstyle.js';
import { composeRecipeProps } from '../../styles/xstyle.js';
import { fieldRecipe } from './recipe.js';

/** Props for the primitive field container. */
export type FieldRootProps = ComponentProps<'div'> & XStyleProps;

/** Simple wrapper used by field primitives. */
export function Field(props: FieldRootProps): JSX.Element {
	const { className, style, xstyle, ...restProps } = props;
	const recipeProps = fieldRecipe({ xstyle: { root: xstyle } }).root;

	return <div {...restProps} {...composeRecipeProps(recipeProps, className, style)} />;
}
