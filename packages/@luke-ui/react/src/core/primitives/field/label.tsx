import type { JSX } from 'react';
import type { LabelProps as RacLabelProps } from 'react-aria-components/Label';
import { Label as RacLabel } from 'react-aria-components/Label';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import type { FieldNecessityIndicator } from './recipe.css.js';
import { fieldRecipe } from './recipe.css.js';

/** Allowed `necessityIndicator` values for `FieldLabel`. */
export type { FieldNecessityIndicator };

interface FieldLabelStyleProps {
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

/**
 * Styled label for form fields.
 *
 * Inside a control root such as `TextInputRoot`, `SwitchRoot`, or `CheckboxRoot`, it connects to the
 * control automatically. In a switch or checkbox root, clicking it toggles the control. Do not also
 * put label text in `SwitchLabel` or `CheckboxLabel`, which draw no required marker.
 *
 * It draws the required marker when the control root is required.
 */
export function FieldLabel(props: FieldLabelProps): JSX.Element {
	const { className, necessityIndicator = 'icon', ...restProps } = props;

	return (
		<RacLabel {...restProps} className={fieldRecipe({ necessityIndicator }).label({ className })} />
	);
}
