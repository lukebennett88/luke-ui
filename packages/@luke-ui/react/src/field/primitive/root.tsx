import type { ComponentProps, JSX } from 'react';
import * as styles from '../../recipes/field.css.js';
import { cx } from '../../utils/index.js';

/** Props for the primitive field container. */
type FieldProps = ComponentProps<'div'>;

/** Simple wrapper used by field primitives. */
export function Field(props: FieldProps): JSX.Element {
	const { className, ...restProps } = props;

	return <div {...restProps} className={cx(styles.field(), className)} />;
}
