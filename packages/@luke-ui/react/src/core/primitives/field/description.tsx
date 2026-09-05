import type { JSX } from 'react';
import type { TextProps as RacTextProps } from 'react-aria-components/Text';
import { Text as RacText } from 'react-aria-components/Text';
import type { XStyleProps } from '../../styles/xstyle.js';
import { composeRecipeProps } from '../../styles/xstyle.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { fieldRecipe } from './recipe.js';

type _FieldDescriptionOmit = DistributiveOmit<RacTextProps, 'id' | 'slot'>;

interface _FieldDescriptionProps extends _FieldDescriptionOmit, XStyleProps {
	/** Element id referenced by `aria-describedby` on the control. */
	id?: RacTextProps['id'];
}

/** Props for `FieldDescription`. */
export type FieldDescriptionProps = Prettify<_FieldDescriptionProps>;

/** Styled helper text shown under a field. */
export function FieldDescription(props: FieldDescriptionProps): JSX.Element {
	const { className, style, xstyle, ...restProps } = props;
	const recipeProps = fieldRecipe({ tone: 'description', xstyle: { message: xstyle } }).message;

	return (
		<RacText
			{...restProps}
			{...composeRecipeProps(recipeProps, className, style)}
			slot="description"
		/>
	);
}
