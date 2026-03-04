import type { JSX } from 'react';
import type { LabelProps as RacLabelProps } from 'react-aria-components';
import { Label as RacLabel } from 'react-aria-components';
import * as styles from '../../../recipes/field.css.js';
import { cx } from '../../../utils.js';

export type FieldNecessityIndicator = 'icon' | 'label';

export interface FieldLabelProps extends RacLabelProps {
	necessityIndicator?: FieldNecessityIndicator;
}

export function FieldLabel(props: FieldLabelProps): JSX.Element {
	const { className, necessityIndicator = 'icon', ...restProps } = props;

	return (
		<RacLabel {...restProps} className={cx(styles.fieldLabel({ necessityIndicator }), className)} />
	);
}
