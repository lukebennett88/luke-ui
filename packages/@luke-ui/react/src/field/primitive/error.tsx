import type { JSX } from 'react';
import type { FieldErrorProps as RacFieldErrorProps } from 'react-aria-components/FieldError';
import { FieldError as RacFieldError } from 'react-aria-components/FieldError';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../../recipes/field.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { cx } from '../../utils/index.js';

interface FieldMessageVariantProps extends NonNullable<styles.FieldMessageVariants> {}

type _FieldErrorOmit = DistributiveOmit<FieldMessageVariantProps, 'tone'>;
interface _FieldErrorProps extends RacFieldErrorProps, _FieldErrorOmit {}

/**
 * Props for `FieldError`.
 *
 * @tier primitive
 */
export type FieldErrorProps = Prettify<_FieldErrorProps>;

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
