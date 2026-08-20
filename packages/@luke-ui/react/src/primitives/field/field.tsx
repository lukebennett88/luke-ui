import type { ComponentProps, JSX, ReactNode } from 'react';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import type { FieldDescriptionProps } from './description.js';
import { FieldDescription } from './description.js';
import type { FieldErrorProps } from './error.js';
import { FieldError } from './error.js';
import {
	isInvalidFromErrorMessage,
	normalizeErrorMessage,
} from './is-invalid-from-error-message.js';
import type { FieldLabelProps, FieldNecessityIndicator } from './label.js';
import { FieldLabel } from './label.js';
import { Field as PrimitiveField } from './root.js';

export type { FieldDescriptionProps, FieldErrorProps, FieldLabelProps, FieldNecessityIndicator };
export {
	FieldDescription,
	FieldError,
	FieldLabel,
	isInvalidFromErrorMessage,
	normalizeErrorMessage,
};

/** Label, description, and error props shared by field compositions. */
export interface FieldSlotProps {
	/** Optional helper text shown below the control. */
	description?: ReactNode;
	/** Error content passed to `FieldError`. Accepts React Aria's render-prop form. */
	errorMessage?: FieldErrorProps['children'];
	/** Label content shown above the control. */
	label?: ReactNode;
	/** Label necessity style. @default 'icon' */
	necessityIndicator?: FieldNecessityIndicator;
}

type PrimitiveFieldProps = ComponentProps<typeof PrimitiveField>;

type _FieldOmit = DistributiveOmit<PrimitiveFieldProps, 'children'>;
interface _FieldProps extends _FieldOmit, FieldSlotProps {
	children: ReactNode;
}

/** Props for the field primitive. */
export type FieldProps = Prettify<_FieldProps>;

/** Composes label, control slot, description, and error text. */
export function Field(props: FieldProps): JSX.Element {
	const {
		children,
		description,
		errorMessage,
		label,
		necessityIndicator = 'icon',
		...restProps
	} = props;

	return (
		<PrimitiveField {...restProps}>
			{label != null ? (
				<FieldLabel necessityIndicator={necessityIndicator}>{label}</FieldLabel>
			) : null}
			{children}
			{description != null ? <FieldDescription>{description}</FieldDescription> : null}
			<FieldError>{errorMessage}</FieldError>
		</PrimitiveField>
	);
}
