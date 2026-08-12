import type { JSX } from 'react';
import type { TextProps as RacTextProps } from 'react-aria-components/Text';
import { Text as RacText } from 'react-aria-components/Text';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import * as styles from './recipe.css.js';

type _FieldDescriptionProps = DistributiveOmit<RacTextProps, 'slot'>;

/** Props for `FieldDescription`. */
export type FieldDescriptionProps = Prettify<_FieldDescriptionProps>;

/** Styled helper text shown under a field. */
export function FieldDescription(props: FieldDescriptionProps): JSX.Element {
	const { className, ...restProps } = props;

	return (
		<RacText
			{...restProps}
			className={styles.fieldRecipe({ tone: 'description' }).message(className)}
			slot="description"
		/>
	);
}
