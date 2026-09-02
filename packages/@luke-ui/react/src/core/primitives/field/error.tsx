import type { JSX } from 'react';
import type { FieldErrorProps as RacFieldErrorProps } from 'react-aria-components/FieldError';
import { FieldError as RacFieldError } from 'react-aria-components/FieldError';
import type { XStyleProps } from '../../styles/xstyle.js';
import { resolveRacXStyleProps } from '../../styles/xstyle.js';
import type { Prettify } from '../../types/prettify.js';
import { resolveFieldRecipeSlotStyles } from './recipe.js';

/** Props for `FieldError`. */
export type FieldErrorProps = Prettify<RacFieldErrorProps & XStyleProps>;

/** Styled validation message for a field. */
export function FieldError(props: FieldErrorProps): JSX.Element {
	const { className, style, xstyle, ...restProps } = props;
	const recipeStyles = resolveFieldRecipeSlotStyles('message', { tone: 'error' });

	return (
		<RacFieldError
			{...restProps}
			{...resolveRacXStyleProps(recipeStyles, xstyle, className, style)}
		/>
	);
}
