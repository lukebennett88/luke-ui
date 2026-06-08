import type { ComponentProps, JSX, ReactNode } from 'react';
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
