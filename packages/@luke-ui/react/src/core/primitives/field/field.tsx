import type { ComponentProps, JSX, ReactNode } from 'react';
import type { RequiredAccessibleName } from '../../types/accessible-name.js';
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
import { fieldRecipe } from './recipe.css.js';
import { Field as PrimitiveField } from './root.js';

export type { FieldDescriptionProps, FieldErrorProps, FieldLabelProps, FieldNecessityIndicator };
export {
	FieldDescription,
	FieldError,
	FieldLabel,
	isInvalidFromErrorMessage,
	normalizeErrorMessage,
};

/** Description and necessity props shared by field compositions. */
interface FieldSlotContentProps {
	/** Optional helper text shown below the control. */
	description?: ReactNode;
	/** Label necessity style. @default 'icon' */
	necessityIndicator?: FieldNecessityIndicator;
}

/** Label, description, and error props for the `Field` primitive. */
interface FieldSlotProps extends FieldSlotContentProps {
	/** Error content passed to `FieldError`. Accepts React Aria's render-prop form. */
	errorMessage?: FieldErrorProps['children'];
	/** Label content shown above the control. */
	label?: ReactNode;
}

/**
 * Naming props for composed stacked fields (`TextInputField`, `ComboboxField`, `SelectField`).
 *
 * Pass a visible `label`, or omit `label` and provide exactly one of `aria-label` /
 * `aria-labelledby`. Composition parents forward the aria props to the React Aria field root.
 *
 * The labelled branch names `aria-label` / `aria-labelledby` as `never` so every union
 * constituent carries those keys. That keeps the type-level XOR with `label`, and lets prop-table
 * analysis see the accessible-name props the same way `RequiredAccessibleName` does for icon-only
 * controls.
 */
export type FieldAccessibleNameProps =
	| (FieldSlotContentProps & {
			/**
			 * Visible label. Pass non-empty, textual, non-interactive content. Place links and buttons
			 * outside it, and associate external label content with `aria-labelledby` instead.
			 */
			label: Exclude<ReactNode, boolean | null | undefined>;
			'aria-label'?: never;
			'aria-labelledby'?: never;
	  })
	| (FieldSlotContentProps & {
			label?: never;
	  } & RequiredAccessibleName);
type PrimitiveFieldProps = ComponentProps<typeof PrimitiveField>;

type _FieldOmit = DistributiveOmit<PrimitiveFieldProps, 'children'>;
interface _FieldProps extends _FieldOmit, FieldSlotProps {
	children: ReactNode;
}

/** Props for the field primitive. */
export type FieldProps = Prettify<_FieldProps>;

/**
 * Standard stacked field anatomy: a label, the control, a description, and an error slot that is
 * always rendered.
 *
 * `Field` provides presentation, not semantics. Render it inside a control root such as
 * `TextInputRoot` or `ComboboxRoot`, which connects the label, description, and error to the
 * control. `Field` and the manual `FieldLabel`, `FieldDescription`, and `FieldError` parts are
 * alternatives, so do not render those parts inside a `Field`.
 */
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

/** Description and error props for the `InlineField` primitive. */
interface InlineFieldSlotProps {
	/** Optional helper text shown below the control, at the field's inline start. */
	description?: ReactNode;
	/** Error content passed to `FieldError`. Accepts React Aria's render-prop form. */
	errorMessage?: FieldErrorProps['children'];
}

type _InlineFieldOmit = DistributiveOmit<ComponentProps<'div'>, 'children'>;
interface _InlineFieldProps extends _InlineFieldOmit, InlineFieldSlotProps {
	/**
	 * The control's label part, such as `CheckboxLabel` or `SwitchLabel`. It holds the control and
	 * its label text.
	 */
	children: ReactNode;
}

/** Props for the inline field primitive. */
export type InlineFieldProps = Prettify<_InlineFieldProps>;

/**
 * Inline field anatomy: a control's label part, a description, and an always-rendered error slot,
 * with the error under the label text. Render it inside a control root such as `CheckboxRoot` or
 * `SwitchRoot`, and use it instead of the manual `FieldDescription` and `FieldError` parts.
 */
export function InlineField(props: InlineFieldProps): JSX.Element {
	const { children, className, description, errorMessage, ...restProps } = props;

	return (
		<div {...restProps} className={fieldRecipe().inline({ className })}>
			{children}
			{description != null ? <FieldDescription>{description}</FieldDescription> : null}
			<FieldError>{errorMessage}</FieldError>
		</div>
	);
}
