import type { ReactNode } from 'react';
import type { FieldErrorProps } from '../primitives/field/error.js';
import type { FieldNecessityIndicator } from '../primitives/field/label.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';

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

type KeysOfUnion<T> = T extends T ? keyof T : never;
type FieldSlotKeys<T extends FieldSlotProps> = Extract<keyof FieldSlotProps, KeysOfUnion<T>>;

/** Splits field slot props (label, description, errorMessage, necessityIndicator) off a field component's props. */
export function composeField<T extends FieldSlotProps>(
	props: T,
): [FieldSlotProps, DistributiveOmit<T, FieldSlotKeys<T>>] {
	const { description, errorMessage, label, necessityIndicator, ...restProps } = props;

	return [
		{ description, errorMessage, label, necessityIndicator },
		restProps as unknown as DistributiveOmit<T, FieldSlotKeys<T>>,
	];
}
