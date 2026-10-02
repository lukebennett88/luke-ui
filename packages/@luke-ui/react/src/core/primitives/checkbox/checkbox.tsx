import type { ComponentProps, JSX, Ref } from 'react';
import type {
	CheckboxButtonProps as RacCheckboxButtonProps,
	CheckboxFieldProps as RacCheckboxFieldProps,
} from 'react-aria-components/Checkbox';
import {
	CheckboxButton as RacCheckboxButton,
	CheckboxField as RacCheckboxField,
} from 'react-aria-components/Checkbox';
import { TextContext as RacTextContext } from 'react-aria-components/Text';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import type { FieldNecessityIndicator } from '../field/recipe.css.js';
import { rootIdProps } from '../root-id.js';
import type { CheckboxRecipeVariants } from './recipe.css.js';
import { checkboxRecipe } from './recipe.css.js';

type _CheckboxRootOmit = DistributiveOmit<
	RacCheckboxFieldProps,
	'children' | 'className' | 'id' | 'inputRef' | 'render'
>;

interface _CheckboxRootProps extends _CheckboxRootOmit {
	/** Checkbox anatomy: `CheckboxContent`, plus a description and error such as `InlineField`. */
	children: RacCheckboxFieldProps['children'];
	/** Class name for the root element. */
	className?: RacCheckboxFieldProps['className'];
	/** Initial selection state for an uncontrolled checkbox. */
	defaultSelected?: RacCheckboxFieldProps['defaultSelected'];
	/** The `<form>` element to associate the input with, by id. */
	form?: RacCheckboxFieldProps['form'];
	/** Element id for the root element. Use `inputId` for the input. */
	id?: string;
	/** Element id for the input. */
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

type _CheckboxContentOmit = DistributiveOmit<RacCheckboxButtonProps, 'children'>;

interface _CheckboxContentProps extends _CheckboxContentOmit {
	/**
	 * The control, indicator, and visible checkbox label. The label is part of a native `<label>`,
	 * so it takes textual, non-interactive content only. Place links and buttons outside it.
	 */
	children: RacCheckboxButtonProps['children'];
}

/** Props for `CheckboxContent`. */
export type CheckboxContentProps = Prettify<_CheckboxContentProps>;

interface _CheckboxControlProps extends ComponentProps<'span'> {}

/** Props for `CheckboxControl`. */
export type CheckboxControlProps = Prettify<_CheckboxControlProps>;

interface _CheckboxLabelProps extends ComponentProps<'span'> {
	/**
	 * Shows how a required checkbox is marked after the label's last inline content.
	 * @default 'icon'
	 */
	necessityIndicator?: FieldNecessityIndicator;
}

/** Props for `CheckboxLabel`. */
export type CheckboxLabelProps = Prettify<_CheckboxLabelProps>;

interface _CheckboxIndicatorProps extends ComponentProps<'span'> {}

/** Props for `CheckboxIndicator`. */
export type CheckboxIndicatorProps = Prettify<_CheckboxIndicatorProps>;

/**
 * Semantic root for a checkbox. It connects the input to the content, description, and error
 * inside it, and owns the checkbox's selection, state, validation, and size.
 *
 * `id` targets the root element. Pass `inputId` to set the input's id.
 */
export function CheckboxRoot(props: CheckboxRootProps): JSX.Element {
	const { className, id, inputId, size, ...restProps } = props;

	return (
		<RacCheckboxField
			{...restProps}
			{...rootIdProps(id, inputId)}
			className={composeRenderProps(className, (className) => {
				return checkboxRecipe({ size }).root({ className });
			})}
		/>
	);
}

/**
 * The native `<label>` for the checkbox. It holds `CheckboxControl` and `CheckboxLabel`, and keeps
 * the input and label associated.
 *
 * The label text must be textual, non-interactive content. A link or button inside a native label
 * is not supported. Place it as a sibling outside `CheckboxContent`.
 */
export function CheckboxContent(props: CheckboxContentProps): JSX.Element {
	const { children, className, ...restProps } = props;

	// React Aria provides slotted `Text` context for the description and error, so a `Text` without a
	// `slot` throws. The label has no slot, so clear the context for everything inside it.
	const labelChildren = composeRenderProps(children, (resolved) => (
		<RacTextContext.Provider value={null}>{resolved}</RacTextContext.Provider>
	));

	return (
		<RacCheckboxButton
			{...restProps}
			className={composeRenderProps(className, (className) => {
				return checkboxRecipe().content({ className });
			})}
		>
			{labelChildren}
		</RacCheckboxButton>
	);
}

/** Line-height-sized wrapper that centres the fixed visual checkbox affordance. */
export function CheckboxControl(props: CheckboxControlProps): JSX.Element {
	const { className, ...restProps } = props;
	return <span {...restProps} className={checkboxRecipe().control({ className })} />;
}

/**
 * The visible label text. It sits inside `CheckboxContent`, after `CheckboxControl`, and draws the
 * required marker after its last inline content when the root is required.
 */
export function CheckboxLabel(props: CheckboxLabelProps): JSX.Element {
	const { className, necessityIndicator, ...restProps } = props;
	return (
		<span {...restProps} className={checkboxRecipe({ necessityIndicator }).label({ className })} />
	);
}

/** Visual square that reflects selected, indeterminate, disabled, and invalid states. */
export function CheckboxIndicator(props: CheckboxIndicatorProps): JSX.Element {
	const { className, ...restProps } = props;
	return <span {...restProps} aria-hidden className={checkboxRecipe().indicator({ className })} />;
}
