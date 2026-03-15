import type { JSX } from 'react';
import type { SelectProps as RacSelectProps } from 'react-aria-components';
import { composeRenderProps, Select as RacSelect } from 'react-aria-components';
import * as styles from '../../../recipes/select-input.css.js';
import { cx } from '../../../utils.js';

/** Props for the `PickerInput` select root (single-select only). */
export interface PickerInputProps<T extends object> extends Omit<
	RacSelectProps<T, 'single'>,
	'selectionMode'
> {}

/** Spectrum-style picker root primitive (single-select only). */
export function PickerInput<T extends object>(props: PickerInputProps<T>): JSX.Element {
	return (
		<RacSelect
			{...props}
			className={composeRenderProps(props.className, (className) => {
				return cx(styles.selectInputRoot, className);
			})}
		/>
	);
}
