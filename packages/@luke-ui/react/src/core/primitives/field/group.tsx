import type { JSX, ReactNode } from 'react';
import { FieldDescription } from './description.js';
import { FieldError } from './error.js';
import type { FieldErrorProps } from './error.js';
import { fieldGroupRecipe } from './group-recipe.css.js';
import { FieldLabel } from './label.js';
import type { NecessityIndicator } from './necessity-context.js';

interface FieldGroupLayoutProps {
	children: ReactNode;
	description?: ReactNode;
	errorMessage?: FieldErrorProps['children'];
	isRequired: boolean;
	label?: ReactNode;
	necessityIndicator?: NecessityIndicator;
	orientation: 'vertical' | 'horizontal';
}

/** Common presentation for labelled groups of field controls. */
export function FieldGroupLayout(props: FieldGroupLayoutProps): JSX.Element {
	const {
		children,
		description,
		errorMessage,
		isRequired,
		label,
		necessityIndicator,
		orientation,
	} = props;
	const slots = fieldGroupRecipe({ orientation });

	return (
		<div className={slots.root()}>
			{label != null ? (
				<FieldLabel isRequired={isRequired} necessityIndicator={necessityIndicator} slot="label">
					{label}
				</FieldLabel>
			) : null}
			{description != null ? <FieldDescription>{description}</FieldDescription> : null}
			<div className={slots.options()}>{children}</div>
			<FieldError>{errorMessage}</FieldError>
		</div>
	);
}
