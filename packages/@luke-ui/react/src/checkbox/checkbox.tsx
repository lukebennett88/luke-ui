export { checkboxRecipe, type CheckboxRecipeVariants } from '../primitives/checkbox/recipe.css.js';
import { useObjectRef } from '@react-aria/utils';
import type { JSX, ReactNode, Ref } from 'react';
import type { CheckboxFieldProps as RacCheckboxFieldProps } from 'react-aria-components/Checkbox';
import type { CheckboxProps as PrimitiveCheckboxProps } from '../primitives/checkbox/checkbox.js';
import {
	CheckboxContent,
	CheckboxControl,
	CheckboxIndicator,
	Checkbox as PrimitiveCheckbox,
} from '../primitives/checkbox/checkbox.js';
import { FieldDescription } from '../primitives/field/description.js';
import type { FieldErrorProps } from '../primitives/field/error.js';
import { FieldError } from '../primitives/field/error.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';

type _CheckboxOmit = DistributiveOmit<RacCheckboxFieldProps, 'children' | 'inputRef'>;

interface _CheckboxProps extends _CheckboxOmit {
	/** Checkbox label content. */
	children: ReactNode;
	/** Initial selection state for an uncontrolled checkbox. */
	defaultSelected?: PrimitiveCheckboxProps['defaultSelected'];
	/** Supporting text shown beneath the checkbox label. */
	description?: ReactNode;
	/** Validation message shown when the checkbox is invalid. */
	errorMessage?: FieldErrorProps['children'];
	/**
	 * Forwarded to the underlying `<input type="checkbox">` element.
	 *
	 * This field takes no plain `ref`: `inputRef` is the only way to reach the
	 * control, so a ref can never silently resolve to a wrapper element instead.
	 *
	 * Widened from React Aria's own `inputRef`, which only takes a ref object, so a
	 * callback ref (what form libraries hand out) is accepted too.
	 */
	inputRef?: Ref<HTMLInputElement>;
	/** Whether the checkbox is unavailable. */
	isDisabled?: PrimitiveCheckboxProps['isDisabled'];
	/** Whether the checkbox displays a mixed selection state. */
	isIndeterminate?: PrimitiveCheckboxProps['isIndeterminate'];
	/** Whether the checkbox is invalid. */
	isInvalid?: PrimitiveCheckboxProps['isInvalid'];
	/** Whether the checkbox can be read but not changed. */
	isReadOnly?: PrimitiveCheckboxProps['isReadOnly'];
	/** Whether the checkbox is required before the form can submit. */
	isRequired?: PrimitiveCheckboxProps['isRequired'];
	/** Whether the checkbox is selected. */
	isSelected?: PrimitiveCheckboxProps['isSelected'];
	/** Called when the selection changes. */
	onChange?: PrimitiveCheckboxProps['onChange'];
	/**
	 * Visual size of the checkbox control.
	 *
	 * @default 'medium'
	 */
	size?: PrimitiveCheckboxProps['size'];
}

/** Props for `Checkbox`. */
export type CheckboxProps = Prettify<_CheckboxProps>;

/** A labelled checkbox with optional description and validation message. */
export function Checkbox(props: CheckboxProps): JSX.Element {
	const { children, description, errorMessage, inputRef, ...checkboxProps } = props;
	// React Aria types its own `inputRef` as a ref object, so a callback ref is a type
	// error even though it would work: RAC merges the ref itself. `useObjectRef` gives
	// the declared type what it asks for rather than leaning on that internal detail.
	const objectInputRef = useObjectRef(inputRef);

	return (
		<PrimitiveCheckbox {...checkboxProps} inputRef={objectInputRef}>
			<CheckboxContent>
				<CheckboxControl>
					<CheckboxIndicator />
				</CheckboxControl>
				{children}
			</CheckboxContent>
			{description != null ? <FieldDescription>{description}</FieldDescription> : null}
			<FieldError>{errorMessage}</FieldError>
		</PrimitiveCheckbox>
	);
}
