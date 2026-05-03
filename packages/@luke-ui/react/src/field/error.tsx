import type { JSX } from 'react';
import type { FieldErrorProps as RacFieldErrorProps } from 'react-aria-components/FieldError';
import { FieldError as RacFieldError } from 'react-aria-components/FieldError';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../recipes/field.css.js';
import { cx } from '../utils/index.js';

interface FieldMessageVariantProps extends NonNullable<styles.FieldMessageVariants> {}

/** Props for `FieldError`. */
export interface FieldErrorProps
	extends RacFieldErrorProps, Omit<FieldMessageVariantProps, 'tone'> {}

/** Styled validation message for a field. */
export function FieldError(props: FieldErrorProps): JSX.Element {
	return (
		<RacFieldError
			{...props}
			className={composeRenderProps(props.className, (className) => {
				return cx(styles.fieldMessage({ tone: 'error' }), className);
			})}
		/>
	);
}
