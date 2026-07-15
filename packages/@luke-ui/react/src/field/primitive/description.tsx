import type { JSX } from 'react';
import type { TextProps as RacTextProps } from 'react-aria-components/Text';
import { Text as RacText } from 'react-aria-components/Text';
import * as styles from '../../recipes/field.css.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import { cx } from '../../utils/index.js';

interface FieldMessageVariantProps extends NonNullable<styles.FieldMessageVariants> {}

/**
 * Props for `FieldDescription`.
 *
 * @tier primitive
 */
export interface FieldDescriptionProps
	extends
		DistributiveOmit<RacTextProps, 'slot'>,
		DistributiveOmit<FieldMessageVariantProps, 'tone'> {}

/** Styled helper text shown under a field. */
export function FieldDescription(props: FieldDescriptionProps): JSX.Element {
	const { className, ...restProps } = props;

	return (
		<RacText
			{...restProps}
			className={cx(styles.fieldMessage({ tone: 'description' }), className)}
			slot="description"
		/>
	);
}
