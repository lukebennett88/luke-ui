import type { JSX } from 'react';
import type { TextProps as RacTextProps } from 'react-aria-components/Text';
import { Text as RacText } from 'react-aria-components/Text';
import * as styles from '../../recipes/field.css.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';

type _FieldDescriptionOmit = DistributiveOmit<RacTextProps, 'slot'>;
interface _FieldDescriptionProps extends _FieldDescriptionOmit {}

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
			className={styles.field({ tone: 'description' }).message(className)}
			slot="description"
		/>
	);
}
