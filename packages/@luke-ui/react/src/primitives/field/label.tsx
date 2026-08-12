import type { JSX } from 'react';
import type { LabelProps as RacLabelProps } from 'react-aria-components/Label';
import { Label as RacLabel } from 'react-aria-components/Label';
import type { Prettify } from '../../types/prettify.js';
import * as styles from './recipe.css.js';

/** Allowed `necessityIndicator` values for `FieldLabel`. */
export type FieldNecessityIndicator = styles.FieldNecessityIndicator;

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
		<RacLabel
			{...restProps}
			className={styles.fieldRecipe({ necessityIndicator }).label(className)}
		/>
	);
}
