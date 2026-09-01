import type { JSX } from 'react';
import type { LabelProps as RacLabelProps } from 'react-aria-components/Label';
import { Label as RacLabel } from 'react-aria-components/Label';
import type { XStyleProps } from '../../styles/xstyle.js';
import { resolveXStyleProps } from '../../styles/xstyle.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import type { FieldNecessityIndicator } from './recipe.js';
import { resolveFieldRecipeStyles } from './recipe.js';

/** Allowed `necessityIndicator` values for `FieldLabel`. */
export type { FieldNecessityIndicator };

interface FieldLabelStyleProps extends XStyleProps {
	/** Shows how required fields are marked. */
	necessityIndicator?: FieldNecessityIndicator;
}

type _FieldLabelOmit = DistributiveOmit<RacLabelProps, 'htmlFor'>;

interface _FieldLabelProps extends _FieldLabelOmit, FieldLabelStyleProps {
	/** Associates the label with a form control. */
	htmlFor?: RacLabelProps['htmlFor'];
}

/** Props for `FieldLabel`. */
export type FieldLabelProps = Prettify<_FieldLabelProps>;

/** Styled label for form fields. */
export function FieldLabel(props: FieldLabelProps): JSX.Element {
	const { className, necessityIndicator = 'icon', style, xstyle, ...restProps } = props;

	return (
		<RacLabel
			{...restProps}
			{...resolveXStyleProps(
				resolveFieldRecipeStyles({ necessityIndicator }).label,
				xstyle,
				className,
				style,
			)}
		/>
	);
}
