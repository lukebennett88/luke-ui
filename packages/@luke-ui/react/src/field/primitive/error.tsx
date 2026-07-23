import type { JSX } from 'react';
import type { FieldErrorProps as RacFieldErrorProps } from 'react-aria-components/FieldError';
import { FieldError as RacFieldError } from 'react-aria-components/FieldError';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../../recipes/field.css.js';
import type { Prettify } from '../../types/prettify.js';

/**
 * Props for `FieldError`.
 *
 * @tier primitive
 */
export type FieldErrorProps = Prettify<RacFieldErrorProps>;

/** Styled validation message for a field. */
export function FieldError(props: FieldErrorProps): JSX.Element {
	return (
		<RacFieldError
			{...props}
			className={composeRenderProps(props.className, (className) => {
				return styles.field({ tone: 'error' }).message(className);
			})}
		/>
	);
}
