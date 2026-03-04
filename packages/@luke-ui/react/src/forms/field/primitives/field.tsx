import type { ComponentProps, JSX } from 'react';
import * as styles from '../../../recipes/field.css.js';
import { cx } from '../../../utils.js';

export type FieldProps = ComponentProps<'div'>;

export function Field(props: FieldProps): JSX.Element {
	const { className, ...restProps } = props;

	return <div {...restProps} className={cx(styles.field, className)} />;
}
