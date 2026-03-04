import type { ComponentProps, JSX, ReactNode } from 'react';
import { FieldDescription } from '../primitives/field-description.js';
import { FieldError } from '../primitives/field-error.js';
import type { FieldErrorProps } from '../primitives/field-error.js';
import type { FieldNecessityIndicator } from '../primitives/field-label.js';
import { FieldLabel } from '../primitives/field-label.js';
import { Field as PrimitiveField } from '../primitives/field.js';

type PrimitiveFieldProps = ComponentProps<typeof PrimitiveField>;

export interface FieldProps extends Omit<PrimitiveFieldProps, 'children'> {
	children: ReactNode;
	description?: ReactNode;
	errorMessage?: FieldErrorProps['children'];
	label?: ReactNode;
	necessityIndicator?: FieldNecessityIndicator;
}

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
