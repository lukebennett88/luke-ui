import type { ComponentProps, JSX, ReactNode } from 'react';
import { FieldDescription } from '../field-description/index.js';
import type { FieldErrorProps } from '../field-error/index.js';
import { FieldError } from '../field-error/index.js';
import type { FieldNecessityIndicator } from '../field-label/index.js';
import { FieldLabel } from '../field-label/index.js';
import { Field as PrimitiveField } from '../field/primitive.js';

type PrimitiveFieldProps = ComponentProps<typeof PrimitiveField>;

/** Props for the composed `Field`. */
export interface FieldProps extends Omit<PrimitiveFieldProps, 'children'> {
	children: ReactNode;
	/** Optional helper text shown below the input. */
	description?: ReactNode;
	/** Error content passed to `FieldError`. */
	errorMessage?: FieldErrorProps['children'];
	/** Label content shown above the input. */
	label?: ReactNode;
	/** Label necessity style. Defaults to `'icon'`. */
	necessityIndicator?: FieldNecessityIndicator;
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
