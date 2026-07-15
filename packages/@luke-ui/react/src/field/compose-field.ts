import type { ReactNode } from 'react';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { FieldErrorProps } from './primitive/error.js';
import type { FieldNecessityIndicator } from './primitive/label.js';

export interface FieldSlotProps {
	/** Optional helper text shown below the control. */
	description?: ReactNode;
	/** Error content passed to `FieldError`. */
	errorMessage?: FieldErrorProps['children'];
	/** Label content shown above the control. */
	label?: ReactNode;
	/** Label necessity style. @default 'icon' */
	necessityIndicator?: FieldNecessityIndicator;
}

/** Splits the `Field` slot props (label/description/errorMessage/necessityIndicator) off a Composed field's props. */
export function composeField<T extends FieldSlotProps>(
	props: T,
): [FieldSlotProps, DistributiveOmit<T, keyof FieldSlotProps>] {
	const { description, errorMessage, label, necessityIndicator, ...restProps } = props;

	return [
		{ description, errorMessage, label, necessityIndicator },
		restProps as unknown as DistributiveOmit<T, keyof FieldSlotProps>,
	];
}
