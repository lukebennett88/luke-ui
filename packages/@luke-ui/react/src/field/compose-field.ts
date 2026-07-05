import type { ReactNode } from 'react';
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
): [FieldSlotProps, Omit<T, keyof FieldSlotProps>] {
	const { description, errorMessage, label, necessityIndicator, ...restProps } = props;

	return [{ description, errorMessage, label, necessityIndicator }, restProps];
}
