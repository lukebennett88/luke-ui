import type { JSX } from 'react';
import type { LabelProps as RacLabelProps } from 'react-aria-components/Label';
import { Label as RacLabel } from 'react-aria-components/Label';
import * as styles from '../../recipes/field.css.js';
import { cx } from '../../utils/index.js';

interface FieldLabelVariantProps extends NonNullable<styles.FieldLabelVariants> {}

/** Allowed `necessityIndicator` values for `FieldLabel`. */
export type FieldNecessityIndicator = NonNullable<FieldLabelVariantProps['necessityIndicator']>;

interface FieldLabelStyleProps {
	/** Shows how required fields are marked. */
	necessityIndicator?: FieldNecessityIndicator;
}

/** Props for `FieldLabel`. */
export interface FieldLabelProps
	extends Omit<RacLabelProps, keyof FieldLabelStyleProps>, FieldLabelStyleProps {}

/** Styled label for form fields. */
export function FieldLabel(props: FieldLabelProps): JSX.Element {
	const { className, necessityIndicator = 'icon', ...restProps } = props;

	return (
		<RacLabel {...restProps} className={cx(styles.fieldLabel({ necessityIndicator }), className)} />
	);
}
