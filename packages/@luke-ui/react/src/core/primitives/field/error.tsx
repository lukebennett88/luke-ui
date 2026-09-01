import type { JSX } from 'react';
import type { FieldErrorProps as RacFieldErrorProps } from 'react-aria-components/FieldError';
import { FieldError as RacFieldError } from 'react-aria-components/FieldError';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import type { XStyleProp } from '../../styles/xstyle.js';
import { resolveXStyleProps } from '../../styles/xstyle.js';
import type { Prettify } from '../../types/prettify.js';
import { resolveFieldRecipeStyles } from './recipe.js';

interface FieldErrorStyleProps {
	/**
	 * Extra styles as one or more `stylex.create(...)` objects. Applied after `FieldError`'s own
	 * styles and before `className`. A same-property `xstyle` value wins over those styles. A
	 * consumer `className` still beats `xstyle`, and inline `style` beats `className`.
	 */
	xstyle?: XStyleProp;
}

/** Props for `FieldError`. */
export type FieldErrorProps = Prettify<RacFieldErrorProps & FieldErrorStyleProps>;

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
