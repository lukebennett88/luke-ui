import type { JSX } from 'react';
import type { TextProps as RacTextProps } from 'react-aria-components/Text';
import { Text as RacText } from 'react-aria-components/Text';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { fieldRecipe } from './recipe.css.js';

type _FieldDescriptionOmit = DistributiveOmit<RacTextProps, 'id' | 'slot'>;

interface _FieldDescriptionProps extends _FieldDescriptionOmit {
	/** Element id referenced by `aria-describedby` on the control. */
	id?: RacTextProps['id'];
}

/** Props for `FieldDescription`. */
export type FieldDescriptionProps = Prettify<_FieldDescriptionProps>;

/** Styled helper text shown under a field. */
export function FieldDescription(props: FieldDescriptionProps): JSX.Element {
	const { className, ...restProps } = props;

	return (
		<RacText
			{...restProps}
			className={fieldRecipe({ tone: 'description' }).message(className)}
			slot="description"
		/>
	);
}
