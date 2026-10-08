import type { ComponentProps, JSX, Ref } from 'react';
import { useId, useMemo } from 'react';
import type {
	CheckboxButtonProps as RacCheckboxButtonProps,
	CheckboxFieldProps as RacCheckboxFieldProps,
} from 'react-aria-components/Checkbox';
import {
	CheckboxButton as RacCheckboxButton,
	CheckboxField as RacCheckboxField,
} from 'react-aria-components/Checkbox';
import { LabelContext } from 'react-aria-components/Label';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { fieldRecipe } from '../field/recipe.css.js';
import { rootIdProps } from '../root-id.js';
import type { CheckboxRecipeVariants } from './styles.css.js';
import { checkboxRecipe } from './styles.css.js';

type _CheckboxRootOmit = DistributiveOmit<
	RacCheckboxFieldProps,
	'children' | 'className' | 'id' | 'inputRef' | 'render'
>;

interface _CheckboxRootProps extends _CheckboxRootOmit {
	/**
	 * Checkbox anatomy: `CheckboxLabel`, plus a `FieldLabel`, a description, and an error such as
	 * `InlineField`.
	 */
	children: RacCheckboxFieldProps['children'];
	/** Class name for the root element. */
	className?: RacCheckboxFieldProps['className'];
	/** Initial selection state for an uncontrolled checkbox. */
	defaultSelected?: RacCheckboxFieldProps['defaultSelected'];
	/** The `<form>` element to associate the input with, by id. */
	form?: RacCheckboxFieldProps['form'];
	/** Element id for the root element. Use `inputId` for the input. */
	id?: string;
	/** Element id for the input and the `for` of a `FieldLabel` in the root. Defaults to a generated id. */
	inputId?: RacCheckboxFieldProps['id'];
	/** Forwarded to the underlying `<input type="checkbox">` element. */
	inputRef?: RacCheckboxFieldProps['inputRef'];
	/** Whether the checkbox is disabled. */
	isDisabled?: RacCheckboxFieldProps['isDisabled'];
	/** Whether the checkbox displays a mixed selection state. */
	isIndeterminate?: RacCheckboxFieldProps['isIndeterminate'];
	/** Marks the checkbox invalid, for example after failed validation. */
	isInvalid?: RacCheckboxFieldProps['isInvalid'];
	/** Whether the checkbox can be read but not changed. */
	isReadOnly?: RacCheckboxFieldProps['isReadOnly'];
	/** Whether the checkbox is required before the form can submit. */
	isRequired?: RacCheckboxFieldProps['isRequired'];
	/** Whether the checkbox is selected. */
	isSelected?: RacCheckboxFieldProps['isSelected'];
	/** The name of the input, used when submitting an HTML form. */
	name?: RacCheckboxFieldProps['name'];
	/** Called when the selection changes. */
	onChange?: RacCheckboxFieldProps['onChange'];
	/** Forwarded to the root element. */
	ref?: Ref<HTMLDivElement>;
	/**
	 * Visual size of the checkbox control.
	 *
	 * @default 'medium'
	 */
	size?: CheckboxRecipeVariants['size'];
	/** Custom validation function run against the selection. Return a message, or `true`/`null` when valid. */
	validate?: RacCheckboxFieldProps['validate'];
	/**
	 * When native HTML form validation runs.
	 * @default 'native'
	 */
	validationBehavior?: RacCheckboxFieldProps['validationBehavior'];
	/** The value submitted with an HTML form when the checkbox is selected. */
	value?: RacCheckboxFieldProps['value'];
}

/** Props for `CheckboxRoot`. */
export type CheckboxRootProps = Prettify<_CheckboxRootProps>;

interface _CheckboxLabelProps extends RacCheckboxButtonProps {
	/**
	 * `CheckboxControl` plus textual, non-interactive label content, unless a `FieldLabel` supplies
	 * the label. Pass a function to render from the checkbox state.
	 */
	children: RacCheckboxButtonProps['children'];
	/** Forwarded to the `<label>` element. */
	ref?: Ref<HTMLLabelElement>;
}

/** Props for `CheckboxLabel`. */
export type CheckboxLabelProps = Prettify<_CheckboxLabelProps>;

interface _CheckboxControlProps extends ComponentProps<'span'> {}

/** Props for `CheckboxControl`. */
export type CheckboxControlProps = Prettify<_CheckboxControlProps>;

interface _CheckboxIndicatorProps extends ComponentProps<'span'> {}

/** Props for `CheckboxIndicator`. */
export type CheckboxIndicatorProps = Prettify<_CheckboxIndicatorProps>;

/**
 * Semantic root for a checkbox. It owns the selection, state, validation, and size.
 *
 * `id`, `className`, and `ref` target the root element. `inputId` and `inputRef` target the input.
 * Without an `inputId`, the root generates one.
 *
 * Put the visible label in `CheckboxLabel`, or draw it elsewhere in the root with `FieldLabel`. A
 * `FieldLabel` and a `FieldDescription` anywhere inside the root name and describe the checkbox,
 * with no ids to pass. A `FieldLabel` draws the required marker for `isRequired`. `CheckboxLabel`
 * does not.
 */
export function CheckboxRoot(props: CheckboxRootProps): JSX.Element {
	const { className, id, inputId, size, ...restProps } = props;
	const generatedInputId = useId();
	const resolvedInputId = inputId ?? generatedInputId;
	const labelContext = useMemo(() => ({ htmlFor: resolvedInputId }), [resolvedInputId]);

	return (
		<LabelContext.Provider value={labelContext}>
			<RacCheckboxField
				{...restProps}
				{...rootIdProps(id, resolvedInputId)}
				className={composeRenderProps(className, (className) => {
					return checkboxRecipe({ size }).root({ className });
				})}
			/>
		</LabelContext.Provider>
	);
}

/**
 * The clickable native `<label>` for the checkbox. It holds the hidden input and `CheckboxControl`.
 *
 * Add the label text here, or leave it out and draw the label with `FieldLabel` elsewhere in the
 * root. Do not do both, because the checkbox's name joins the text from each. Place links and
 * buttons outside it.
 */
export function CheckboxLabel(props: CheckboxLabelProps): JSX.Element {
	const { className, ...restProps } = props;

	return (
		<RacCheckboxButton
			{...restProps}
			className={composeRenderProps(className, (className) => {
				return fieldRecipe().inlineLabel({ className });
			})}
		/>
	);
}

/** Line-height-sized wrapper that centres the fixed visual checkbox affordance. */
export function CheckboxControl(props: CheckboxControlProps): JSX.Element {
	const { className, ...restProps } = props;
	return <span {...restProps} className={checkboxRecipe().control({ className })} />;
}

/** Visual square that reflects selected, indeterminate, disabled, and invalid states. */
export function CheckboxIndicator(props: CheckboxIndicatorProps): JSX.Element {
	const { className, ...restProps } = props;
	return <span {...restProps} aria-hidden className={checkboxRecipe().indicator({ className })} />;
}
