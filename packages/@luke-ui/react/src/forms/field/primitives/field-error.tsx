import type { JSX } from 'react';
import type { FieldErrorProps as RacFieldErrorProps } from 'react-aria-components';
import { composeRenderProps, FieldError as RacFieldError } from 'react-aria-components';
import * as styles from '../../../recipes/field.css.js';
import { cx } from '../../../utils.js';

/** Props for `FieldError`. */
export interface FieldErrorProps extends RacFieldErrorProps {}

/** Styled validation message for a field. */
export function FieldError(props: FieldErrorProps): JSX.Element {
	return (
		<RacFieldError
			{...props}
			className={composeRenderProps(props.className, (className) => {
				return cx(styles.fieldError, className);
			})}
		/>
	);
}
