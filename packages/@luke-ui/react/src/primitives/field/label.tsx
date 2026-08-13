import type { JSX } from 'react';
import type { LabelProps as RacLabelProps } from 'react-aria-components/Label';
import { Label as RacLabel } from 'react-aria-components/Label';
import type { Prettify } from '../../types/prettify.js';
import type { FieldNecessityIndicator } from './recipe.css.js';
import { fieldRecipe } from './recipe.css.js';

/** Allowed `necessityIndicator` values for `FieldLabel`. */
export type { FieldNecessityIndicator };

interface FieldLabelStyleProps {
	/** Shows how required fields are marked. */
	necessityIndicator?: FieldNecessityIndicator;
}

interface _FieldLabelProps extends RacLabelProps, FieldLabelStyleProps {}

/** Props for `FieldLabel`. */
export type FieldLabelProps = Prettify<_FieldLabelProps>;

/** Styled label for form fields. */
export function FieldLabel(props: FieldLabelProps): JSX.Element {
	const { className, necessityIndicator = 'icon', ...restProps } = props;

	return (
		<RacLabel {...restProps} className={fieldRecipe({ necessityIndicator }).label(className)} />
	);
}
