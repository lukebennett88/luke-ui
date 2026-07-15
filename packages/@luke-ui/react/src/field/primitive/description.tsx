import type { JSX } from 'react';
import type { TextProps as RacTextProps } from 'react-aria-components/Text';
import { Text as RacText } from 'react-aria-components/Text';
import * as styles from '../../recipes/field.css.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { cx } from '../../utils/index.js';

interface FieldMessageVariantProps extends NonNullable<styles.FieldMessageVariants> {}

type _FieldDescriptionOmit1 = DistributiveOmit<RacTextProps, 'slot'>;
type _FieldDescriptionOmit2 = DistributiveOmit<FieldMessageVariantProps, 'tone'>;
interface _FieldDescriptionProps extends _FieldDescriptionOmit1, _FieldDescriptionOmit2 {}

/**
 * Props for `FieldDescription`.
 *
 * @tier primitive
 */
export type FieldDescriptionProps = Prettify<_FieldDescriptionProps>;

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
