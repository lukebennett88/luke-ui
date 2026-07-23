import type { JSX } from 'react';
import type { LabelProps as RacLabelProps } from 'react-aria-components/Label';
import { Label as RacLabel } from 'react-aria-components/Label';
import * as styles from '../../recipes/field.css.js';
import type { Prettify } from '../../types/prettify.js';

/** Allowed `necessityIndicator` values for `FieldLabel`. */
export type FieldNecessityIndicator = styles.FieldNecessityIndicator;

interface FieldLabelStyleProps {
	/** Shows how required fields are marked. */
	necessityIndicator?: FieldNecessityIndicator;
}

interface _FieldLabelProps extends RacLabelProps, FieldLabelStyleProps {}

/**
 * Props for `FieldLabel`.
 *
 * @tier primitive
 */
export type FieldLabelProps = Prettify<_FieldLabelProps>;

/** Styled label for form fields. */
export function FieldLabel(props: FieldLabelProps): JSX.Element {
	const { className, necessityIndicator = 'icon', ...restProps } = props;

	return (
		<RacLabel {...restProps} className={styles.field({ necessityIndicator }).label(className)} />
	);
}
