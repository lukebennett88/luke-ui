import type { ComponentProps, JSX, Ref } from 'react';
import { useId, useMemo } from 'react';
import { LabelContext } from 'react-aria-components/Label';
import type {
	SwitchButtonProps as RacSwitchButtonProps,
	SwitchFieldProps as RacSwitchFieldProps,
} from 'react-aria-components/Switch';
import {
	SwitchButton as RacSwitchButton,
	SwitchField as RacSwitchField,
} from 'react-aria-components/Switch';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { fieldRecipe } from '../field/recipe.css.js';
import { rootIdProps } from '../root-id.js';
import type { SwitchRecipeVariants } from './styles.css.js';
import { switchRecipe } from './styles.css.js';

type _SwitchRootOmit = DistributiveOmit<
	RacSwitchFieldProps,
	'children' | 'className' | 'id' | 'inputRef' | 'render'
>;

interface _SwitchRootProps extends _SwitchRootOmit {
	/**
	 * Switch anatomy: `SwitchLabel`, plus a `FieldLabel`, a description, and an error such as
	 * `InlineField`.
	 */
	children: RacSwitchFieldProps['children'];
	/** Class name for the root element. */
	className?: RacSwitchFieldProps['className'];
	/** Initial selection state for an uncontrolled switch. */
	defaultSelected?: RacSwitchFieldProps['defaultSelected'];
	/** The `<form>` element to associate the input with, by id. */
	form?: RacSwitchFieldProps['form'];
	/** Element id for the root element. Use `inputId` for the input. */
	id?: string;
	/** Element id for the input and the `for` of a `FieldLabel` in the root. Defaults to a generated id. */
	inputId?: RacSwitchFieldProps['id'];
	/** Forwarded to the underlying `<input type="checkbox" role="switch">` element. */
	inputRef?: RacSwitchFieldProps['inputRef'];
	/** Whether the switch is disabled. */
	isDisabled?: RacSwitchFieldProps['isDisabled'];
	/** Marks the switch invalid, for example after failed validation. */
	isInvalid?: RacSwitchFieldProps['isInvalid'];
	/** Whether the switch can be read but not changed. */
	isReadOnly?: RacSwitchFieldProps['isReadOnly'];
	/** Whether the switch must be on before the form can submit. */
	isRequired?: RacSwitchFieldProps['isRequired'];
	/** Whether the switch is on. */
	isSelected?: RacSwitchFieldProps['isSelected'];
	/** The name of the input, used when submitting an HTML form. */
	name?: RacSwitchFieldProps['name'];
	/** Called when the switch turns on or off. */
	onChange?: RacSwitchFieldProps['onChange'];
	/** Forwarded to the root element. */
	ref?: Ref<HTMLDivElement>;
	/**
	 * Visual size of the switch control.
	 *
	 * @default 'medium'
	 */
	size?: SwitchRecipeVariants['size'];
	/** Custom validation function run against the selection. Return a message, or `true`/`null` when valid. */
	validate?: RacSwitchFieldProps['validate'];
	/**
	 * When native HTML form validation runs.
	 * @default 'native'
	 */
	validationBehavior?: RacSwitchFieldProps['validationBehavior'];
	/** The value submitted with an HTML form when the switch is on. */
	value?: RacSwitchFieldProps['value'];
}

/** Props for `SwitchRoot`. */
export type SwitchRootProps = Prettify<_SwitchRootProps>;

interface _SwitchLabelProps extends RacSwitchButtonProps {
	/**
	 * `SwitchControl` plus textual, non-interactive label content, unless a `FieldLabel` supplies the
	 * label. Pass a function to render from the switch state.
	 */
	children: RacSwitchButtonProps['children'];
	/** Forwarded to the `<label>` element. */
	ref?: Ref<HTMLLabelElement>;
}

/** Props for `SwitchLabel`. */
export type SwitchLabelProps = Prettify<_SwitchLabelProps>;

interface _SwitchControlProps extends ComponentProps<'span'> {}

/** Props for `SwitchControl`. */
export type SwitchControlProps = Prettify<_SwitchControlProps>;

interface _SwitchThumbProps extends ComponentProps<'span'> {}

/** Props for `SwitchThumb`. */
export type SwitchThumbProps = Prettify<_SwitchThumbProps>;

/**
 * Semantic root for a switch. It owns the selection, state, validation, and size.
 *
 * `id`, `className`, and `ref` target the root element. `inputId` and `inputRef` target the input.
 * Without an `inputId`, the root generates one.
 *
 * Put the visible label in `SwitchLabel`, or draw it elsewhere in the root with `FieldLabel`. A
 * `FieldLabel` and a `FieldDescription` anywhere inside the root name and describe the switch, with
 * no ids to pass. A `FieldLabel` draws the required marker for `isRequired`. `SwitchLabel` does not.
 */
export function SwitchRoot(props: SwitchRootProps): JSX.Element {
	const { className, id, inputId, size, ...restProps } = props;
	const generatedInputId = useId();
	const resolvedInputId = inputId ?? generatedInputId;
	const labelContext = useMemo(() => ({ htmlFor: resolvedInputId }), [resolvedInputId]);

	return (
		<LabelContext.Provider value={labelContext}>
			<RacSwitchField
				{...restProps}
				{...rootIdProps(id, resolvedInputId)}
				className={composeRenderProps(className, (className) => {
					return switchRecipe({ size }).root({ className });
				})}
			/>
		</LabelContext.Provider>
	);
}

/**
 * The clickable native `<label>` for the switch. It holds the hidden input and `SwitchControl`.
 *
 * Add the label text here, or leave it out and draw the label with `FieldLabel` elsewhere in the
 * root. Do not do both, because the switch's name joins the text from each. Place links and buttons
 * outside it.
 */
export function SwitchLabel(props: SwitchLabelProps): JSX.Element {
	const { className, ...restProps } = props;

	return (
		<RacSwitchButton
			{...restProps}
			className={composeRenderProps(className, (className) => {
				return fieldRecipe().inlineLabel({ className });
			})}
		/>
	);
}

/** The track: the visual switch affordance. It reflects on, disabled, invalid, and focus states. */
export function SwitchControl(props: SwitchControlProps): JSX.Element {
	const { className, ...restProps } = props;
	return <span {...restProps} aria-hidden className={switchRecipe().control({ className })} />;
}

/** The thumb that moves along the track when the switch turns on. `children` render inside it. */
export function SwitchThumb(props: SwitchThumbProps): JSX.Element {
	const { className, ...restProps } = props;
	return <span {...restProps} className={switchRecipe().thumb({ className })} />;
}
