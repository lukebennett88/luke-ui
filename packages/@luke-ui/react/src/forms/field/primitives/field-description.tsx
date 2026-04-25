import type { JSX } from 'react';
import type { TextProps as RacTextProps } from 'react-aria-components/Text';
import { Text as RacText } from 'react-aria-components/Text';
import * as styles from '../../../recipes/field.css.js';
import { cx } from '../../../utils.js';

interface FieldMessageVariantProps extends NonNullable<styles.FieldMessageVariants> {}

/** Props for `FieldDescription`. */
export interface FieldDescriptionProps
	extends Omit<RacTextProps, 'slot'>, Omit<FieldMessageVariantProps, 'tone'> {}

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
