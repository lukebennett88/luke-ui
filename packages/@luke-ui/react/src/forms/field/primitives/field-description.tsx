import type { JSX } from 'react';
import type { TextProps as RacTextProps } from 'react-aria-components';
import { Text as RacText } from 'react-aria-components';
import * as styles from '../../../recipes/field.css.js';
import { cx } from '../../../utils.js';

export interface FieldDescriptionProps extends Omit<RacTextProps, 'slot'> {}

export function FieldDescription(props: FieldDescriptionProps): JSX.Element {
	const { className, ...restProps } = props;

	return (
		<RacText {...restProps} className={cx(styles.fieldDescription, className)} slot="description" />
	);
}
