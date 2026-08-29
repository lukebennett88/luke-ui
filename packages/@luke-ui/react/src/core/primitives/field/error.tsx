import type { JSX } from 'react';
import type { FieldErrorProps as RacFieldErrorProps } from 'react-aria-components/FieldError';
import { FieldError as RacFieldError } from 'react-aria-components/FieldError';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { DocumentedFieldErrorProps } from '../../types/documented-rac-props.js';
import type { Prettify } from '../../types/prettify.js';
import { fieldRecipe } from './recipe.css.js';

type _FieldErrorOmit = DistributiveOmit<RacFieldErrorProps, keyof DocumentedFieldErrorProps>;

interface _FieldErrorProps extends _FieldErrorOmit, DocumentedFieldErrorProps {}

/** Props for `FieldError`. */
export type FieldErrorProps = Prettify<_FieldErrorProps>;

/** Styled validation message for a field. */
export function FieldError(props: FieldErrorProps): JSX.Element {
	return (
		<RacFieldError
			{...props}
			className={composeRenderProps(props.className, (className) => {
				return fieldRecipe({ tone: 'error' }).message(className);
			})}
		/>
	);
}
