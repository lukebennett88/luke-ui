import type { JSX } from 'react';
import type { LabelProps as RacLabelProps } from 'react-aria-components';
import { Label as RacLabel } from 'react-aria-components';
import * as styles from '../../../recipes/field.css.js';
import { cx } from '../../../utils.js';

/** Style for how required or optional state is shown in labels. */
export type FieldNecessityIndicator = 'icon' | 'label';

/** Props for `FieldLabel`. */
export interface FieldLabelProps extends RacLabelProps {
	/** How to show required/optional state. Defaults to `'icon'`. */
	necessityIndicator?: FieldNecessityIndicator;
}

/** Styled label for form fields. */
export function FieldLabel(props: FieldLabelProps): JSX.Element {
	const { className, necessityIndicator = 'icon', ...restProps } = props;

	return (
		<RacLabel {...restProps} className={cx(styles.fieldLabel({ necessityIndicator }), className)} />
	);
}
