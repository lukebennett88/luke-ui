import type { ComponentProps, JSX, ReactNode } from 'react';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { FieldSlotProps } from '../compose-field.js';
import type { FieldDescriptionProps } from './description.js';
import { FieldDescription } from './description.js';
import type { FieldErrorProps } from './error.js';
import { FieldError } from './error.js';
import type { FieldLabelProps, FieldNecessityIndicator } from './label.js';
import { FieldLabel } from './label.js';
import { Field as PrimitiveField } from './root.js';

export type { FieldDescriptionProps, FieldErrorProps, FieldLabelProps, FieldNecessityIndicator };
export { FieldDescription, FieldError, FieldLabel };

type PrimitiveFieldProps = ComponentProps<typeof PrimitiveField>;

/**
 * Props for the composed `Field`.
 *
 * @tier primitive
 */
export interface FieldProps
	extends DistributiveOmit<PrimitiveFieldProps, 'children'>, FieldSlotProps {
	children: ReactNode;
}

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
