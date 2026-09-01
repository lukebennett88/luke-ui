import type { JSX } from 'react';
import type { FieldErrorProps as RacFieldErrorProps } from 'react-aria-components/FieldError';
import { FieldError as RacFieldError } from 'react-aria-components/FieldError';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import type { XStyleProps } from '../../styles/xstyle.js';
import { resolveXStyleProps } from '../../styles/xstyle.js';
import type { Prettify } from '../../types/prettify.js';
import { resolveFieldRecipeStyles } from './recipe.js';

/** Props for `FieldError`. */
export type FieldErrorProps = Prettify<RacFieldErrorProps & XStyleProps>;

/** Styled validation message for a field. */
export function FieldError(props: FieldErrorProps): JSX.Element {
	const { className, style, xstyle, ...restProps } = props;
	const recipeStyles = resolveFieldRecipeStyles({ tone: 'error' }).message;

	return (
		<RacFieldError
			{...restProps}
			className={composeRenderProps(className, (resolvedClassName) => {
				return (
					resolveXStyleProps(recipeStyles, xstyle, resolvedClassName, undefined).className ?? ''
				);
			})}
			style={composeRenderProps(style, (resolvedStyle) => {
				return resolveXStyleProps(recipeStyles, xstyle, undefined, resolvedStyle).style;
			})}
		/>
	);
}
