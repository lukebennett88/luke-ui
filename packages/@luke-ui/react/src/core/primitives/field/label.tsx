import type { JSX } from 'react';
import type { LabelProps as RacLabelProps } from 'react-aria-components/Label';
import { Label as RacLabel } from 'react-aria-components/Label';
import type { XStyleProp } from '../../styles/xstyle.js';
import { resolveXStyleProps } from '../../styles/xstyle.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import type { FieldNecessityIndicator } from './recipe.js';
import { resolveFieldRecipeStyles } from './recipe.js';

/** Allowed `necessityIndicator` values for `FieldLabel`. */
export type { FieldNecessityIndicator };

interface FieldLabelStyleProps {
	/** Shows how required fields are marked. */
	necessityIndicator?: FieldNecessityIndicator;
	/**
	 * Extra styles as one or more `stylex.create(...)` objects. Applied after every variant prop
	 * above and before `className`. A same-property `xstyle` value wins over a variant such as
	 * `necessityIndicator`. A consumer `className` still beats `xstyle`, and inline `style` beats
	 * `className`.
	 */
	xstyle?: XStyleProp;
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
