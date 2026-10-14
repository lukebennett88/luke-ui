import type { JSX, Ref, SubmitEventHandler } from 'react';
import { use } from 'react';
import type { FormProps as RacFormProps } from 'react-aria-components/Form';
import { Form as RacForm } from 'react-aria-components/Form';
import type { NecessityIndicator } from '../primitives/field/necessity-context.js';
import { FormNecessityContext } from '../primitives/field/necessity-context.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';

type _FormOmit = DistributiveOmit<RacFormProps, 'onSubmit'>;

interface _FormProps extends _FormOmit {
	/**
	 * React form Action or URL for ordinary submissions. Prefer this over `onSubmit` when you do not
	 * need the submit event.
	 */
	action?: RacFormProps['action'];
	/**
	 * Controls how nested fields identify required or optional values. A field's own setting takes
	 * precedence.
	 */
	necessityIndicator?: NecessityIndicator;
	/** Called when the form is reset. */
	onReset?: RacFormProps['onReset'];
	/**
	 * Called when the form submits. Use this when you need the submit event, such as calling
	 * `preventDefault` or wiring a form library.
	 */
	onSubmit?: SubmitEventHandler<HTMLFormElement>;
	/**
	 * Determines whether native validation can block submission. Use `'aria'` when a form library
	 * handles validation.
	 * @default 'native'
	 */
	validationBehavior?: RacFormProps['validationBehavior'];
	/** Server validation errors keyed by field name. */
	validationErrors?: RacFormProps['validationErrors'];
	/** Ref forwarded to the form element. */
	ref?: Ref<HTMLFormElement>;
}

/** Props for the `Form` component. */
export type FormProps = Prettify<_FormProps>;

/**
 * Groups fields for submission and shares necessity indicators, validation behaviour, and server
 * errors.
 *
 * Use a layout component such as `Stack` to arrange the fields.
 */
export function Form(props: FormProps): JSX.Element {
	const { children, className, necessityIndicator, onSubmit, ...restProps } = props;
	const parentNecessityIndicator = use(FormNecessityContext);

	// Always wrap so toggling the prop does not remount the form subtree. Pass through the parent
	// value when unset so an unset Form does not shadow an outer Form.
	return (
		<FormNecessityContext value={necessityIndicator ?? parentNecessityIndicator}>
			<RacForm
				{...restProps}
				className={className}
				// React types submit as SubmitEvent; RAC still types onSubmit with deprecated FormEvent.
				onSubmit={onSubmit as RacFormProps['onSubmit']}
			>
				{children}
			</RacForm>
		</FormNecessityContext>
	);
}
