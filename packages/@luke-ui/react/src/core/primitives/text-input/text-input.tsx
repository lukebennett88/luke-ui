import type { ComponentProps, JSX, Ref } from 'react';
import { createContext, use } from 'react';
import type { GroupProps as RacGroupProps } from 'react-aria-components/Group';
import { Group as RacGroup } from 'react-aria-components/Group';
import type { InputProps as RacInputProps } from 'react-aria-components/Input';
import { Input as RacInput, InputContext } from 'react-aria-components/Input';
import type { TextFieldProps as RacTextFieldProps } from 'react-aria-components/TextField';
import { TextField as RacTextField } from 'react-aria-components/TextField';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { useSlottedContext } from 'react-aria-components/slots';
import { cx } from '../../../shared/utils/utils.js';
import { IconSizeProvider } from '../../icon/icon-size-context.js';
import { FIELD_CONTROL_ICON_SIZE } from '../../sizing/control-size.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { rootIdProps } from '../root-id.js';
import type { TextInputSize } from './recipe.css.js';
import { textInputRecipe } from './recipe.css.js';
import { textInputInControlClassName, textInputPartsRecipe } from './styles.css.js';

/** Size set by the nearest size owner around a part: `TextInputControl`, then `TextInputRoot`. */
const TextInputSizeContext = createContext<TextInputSize | null>(null);

/** Whether a `TextInput` renders inside a `TextInputRoot`, which then owns its semantics. */
const TextInputRootContext = createContext(false);

/** Whether a `TextInput` renders inside a `TextInputControl`, which then owns its chrome. */
const TextInputControlContext = createContext(false);

type _TextInputRootOmit = DistributiveOmit<
	RacTextFieldProps,
	'children' | 'className' | 'id' | 'render'
>;

interface _TextInputRootProps extends _TextInputRootOmit {
	/** The field's parts, such as `Field` or `FieldLabel`, and a `TextInput`. */
	children?: RacTextFieldProps['children'];
	/** Class name for the root element. */
	className?: RacTextFieldProps['className'];
	/** Initial value (uncontrolled). */
	defaultValue?: RacTextFieldProps['defaultValue'];
	/** The `<form>` element to associate the input with, by id. */
	form?: RacTextFieldProps['form'];
	/** Element id for the root element. Use `inputId` for the input. */
	id?: string;
	/** Element id for the input. The root generates one when omitted. */
	inputId?: RacTextFieldProps['id'];
	/** Whether the input is disabled. */
	isDisabled?: RacTextFieldProps['isDisabled'];
	/** Marks the input invalid, for example after failed validation. */
	isInvalid?: RacTextFieldProps['isInvalid'];
	/** Whether the input can be read but not changed. */
	isReadOnly?: RacTextFieldProps['isReadOnly'];
	/** Whether a value is required before the form can submit. */
	isRequired?: RacTextFieldProps['isRequired'];
	/** The name of the input, used when submitting an HTML form. */
	name?: RacTextFieldProps['name'];
	/** Called with the new value when it changes. */
	onChange?: RacTextFieldProps['onChange'];
	/** Forwarded to the root element. */
	ref?: Ref<HTMLDivElement>;
	/**
	 * Default size for the input and any `TextInputControl` inside the root. Either part can set
	 * its own `size`.
	 * @default 'medium'
	 */
	size?: TextInputSize;
	/** Custom validation function run against the current value. Return a message, or `true`/`null` when valid. */
	validate?: RacTextFieldProps['validate'];
	/**
	 * When native HTML form validation runs.
	 * @default 'native'
	 */
	validationBehavior?: RacTextFieldProps['validationBehavior'];
	/** Controlled value. */
	value?: RacTextFieldProps['value'];
}

/** Props for `TextInputRoot`. */
export type TextInputRootProps = Prettify<_TextInputRootProps>;

/** Native input props a `TextInputRoot` owns when a `TextInput` renders inside it. */
type RootOwnedInputProp =
	| 'aria-invalid'
	| 'defaultValue'
	| 'disabled'
	| 'form'
	| 'id'
	| 'maxLength'
	| 'minLength'
	| 'name'
	| 'pattern'
	| 'readOnly'
	| 'required'
	| 'type'
	| 'value';

type _TextInputOmit = DistributiveOmit<
	RacInputProps,
	'aria-label' | 'className' | 'inputMode' | 'size' | RootOwnedInputProp
>;

interface _TextInputProps extends _TextInputOmit {
	/** Accessible name for the input when no visible label is connected. */
	'aria-label'?: RacInputProps['aria-label'];
	/** Marks a standalone input invalid. Inside a `TextInputRoot`, the root owns validity. */
	'aria-invalid'?: RacInputProps['aria-invalid'];
	/** Class name for the input element. */
	className?: RacInputProps['className'];
	/** Initial value of a standalone input. Inside a `TextInputRoot`, the root owns the value. */
	defaultValue?: RacInputProps['defaultValue'];
	/** Whether a standalone input is disabled. Inside a `TextInputRoot`, use `isDisabled` on the root. */
	disabled?: RacInputProps['disabled'];
	/** The `<form>` element to associate a standalone input with, by id. */
	form?: RacInputProps['form'];
	/** Element id for a standalone input. Inside a `TextInputRoot`, use `inputId` on the root. */
	id?: RacInputProps['id'];
	/** Hints which input mechanism is most appropriate for the entered content. */
	inputMode?: RacInputProps['inputMode'];
	/** Maximum length of a standalone input's value. Inside a `TextInputRoot`, set `maxLength` on the root. */
	maxLength?: RacInputProps['maxLength'];
	/** Minimum length of a standalone input's value. Inside a `TextInputRoot`, set `minLength` on the root. */
	minLength?: RacInputProps['minLength'];
	/** The name of a standalone input, used when submitting an HTML form. */
	name?: RacInputProps['name'];
	/** Regular expression a standalone input's value must match. Inside a `TextInputRoot`, set `pattern` on the root. */
	pattern?: RacInputProps['pattern'];
	/** Whether a standalone input is read-only. Inside a `TextInputRoot`, use `isReadOnly` on the root. */
	readOnly?: RacInputProps['readOnly'];
	/**
	 * Forwarded to the underlying `<input>` element. Accepts a callback ref or a ref
	 * object, so form libraries that hand out callback refs work without a bridge.
	 */
	ref?: Ref<HTMLInputElement>;
	/** Whether a standalone input is required. Inside a `TextInputRoot`, use `isRequired` on the root. */
	required?: RacInputProps['required'];
	/**
	 * Sets the size of the input, overriding a surrounding `TextInputRoot`. Inside a
	 * `TextInputControl`, the control sets the size instead.
	 * @default 'medium'
	 */
	size?: TextInputSize;
	/** The type of a standalone input, such as `email`. Inside a `TextInputRoot`, set `type` on the root. */
	type?: RacInputProps['type'];
	/** Controlled value of a standalone input. Inside a `TextInputRoot`, the root owns the value. */
	value?: RacInputProps['value'];
}

/** Props for `TextInput`. */
export type TextInputProps = Prettify<_TextInputProps>;

type _TextInputControlOmit = DistributiveOmit<
	RacGroupProps,
	'children' | 'className' | 'isDisabled' | 'isInvalid' | 'render'
>;

interface _TextInputControlProps extends _TextInputControlOmit {
	/** A `TextInput` with optional `TextInputPrefix` and `TextInputSuffix` parts, in document order. */
	children?: RacGroupProps['children'];
	/** Class name for the control element. */
	className?: RacGroupProps['className'];
	/**
	 * Sets the size of the whole control, overriding a surrounding `TextInputRoot`.
	 * @default 'medium'
	 */
	size?: TextInputSize;
}

/** Props for `TextInputControl`. */
export type TextInputControlProps = Prettify<_TextInputControlProps>;

/** Props for `TextInputPrefix`. */
export type TextInputPrefixProps = Prettify<ComponentProps<'span'>>;

/** Props for `TextInputSuffix`. */
export type TextInputSuffixProps = Prettify<ComponentProps<'span'>>;

/**
 * Add the `TextInput`'s own ids to the ones the root wired up. Joining keeps the field's label,
 * description, and error connected, the way React Aria's `useField` does for its consumers.
 */
function joinIds(rootIds: string | undefined, ownIds: string | undefined): string | undefined {
	const ids = [...(rootIds?.split(' ') ?? []), ...(ownIds?.split(' ') ?? [])].filter(Boolean);
	return ids.length > 0 ? [...new Set(ids)].join(' ') : undefined;
}

/**
 * Semantic root for a text input field. It connects a `TextInput` to the label, description, and
 * error parts inside it, and owns the field's value, state, and validation.
 *
 * `id` targets the root element. Pass `inputId` to set the input's id.
 *
 * A `TextInput` inside the root ignores its own `id`, `name`, `form`, `value`, `defaultValue`,
 * `disabled`, `readOnly`, `required`, `aria-invalid`, `type`, `pattern`, `minLength`, and
 * `maxLength`, because the root owns them. Its `aria-describedby` and `aria-labelledby` add to the
 * field's own wiring. Every other prop the root passes down to its parts, such as `size`,
 * `autoComplete`, `inputMode`, and `aria-label`, is a default that a part can override.
 */
export function TextInputRoot(props: TextInputRootProps): JSX.Element {
	const { className, id, inputId, size = 'medium', ...textFieldProps } = props;

	return (
		<TextInputRootContext.Provider value>
			<TextInputSizeContext.Provider value={size}>
				<RacTextField
					{...textFieldProps}
					{...rootIdProps(id, inputId)}
					className={composeRenderProps(className, (value) => {
						return textInputPartsRecipe().root({ className: value });
					})}
				/>
			</TextInputSizeContext.Provider>
		</TextInputRootContext.Provider>
	);
}

/**
 * Text input. Used on its own, it draws its own chrome and takes native input props. Inside a
 * `TextInputRoot`, the root owns its id, name, form, value, state, validation, `type`, `pattern`,
 * `minLength`, and `maxLength`. Inside a `TextInputControl`, the control draws the chrome and sets
 * the size.
 *
 * Inside a root, `aria-describedby` and `aria-labelledby` add to the field's own label,
 * description, and error wiring instead of replacing it. Any other prop set here, such as
 * `placeholder`, `autoComplete`, `inputMode`, `aria-label`, or `size`, applies to the input. Where
 * the root passes down a default for the same prop, the input's own setting wins. A local
 * `onChange` receives the change event and runs alongside the root's `onChange`, which receives
 * the value.
 *
 * Invalid state comes from `aria-invalid` on a standalone input, or from the root. Outside a
 * control, an invalid input draws a thicker border that does not change its size.
 */
export function TextInput(props: TextInputProps): JSX.Element {
	const {
		'aria-invalid': ariaInvalid,
		className,
		defaultValue,
		disabled,
		form,
		id,
		maxLength,
		minLength,
		name,
		pattern,
		readOnly,
		required,
		size: sizeProp,
		type,
		value,
		...inputProps
	} = props;
	const isRooted = use(TextInputRootContext);
	const rootInputProps = useSlottedContext(InputContext);
	const isInControl = use(TextInputControlContext);
	const contextSize = use(TextInputSizeContext);
	// The root supplies these through React Aria's input context. Dropping the input's own values
	// lets the root win, because a local prop would otherwise override the context.
	const standaloneProps = isRooted
		? undefined
		: {
				'aria-invalid': ariaInvalid,
				defaultValue,
				disabled,
				form,
				id,
				maxLength,
				minLength,
				name,
				pattern,
				readOnly,
				required,
				type,
				value,
			};

	// A local `aria-describedby` or `aria-labelledby` would replace the root's through React Aria's
	// merge and disconnect the label, description, and error, so join them instead.
	const rootedWiring = isRooted
		? {
				'aria-describedby': joinIds(
					rootInputProps?.['aria-describedby'],
					inputProps['aria-describedby'],
				),
				'aria-labelledby': joinIds(
					rootInputProps?.['aria-labelledby'],
					inputProps['aria-labelledby'],
				),
			}
		: undefined;

	return (
		<RacInput
			{...inputProps}
			{...standaloneProps}
			{...rootedWiring}
			className={composeRenderProps(className, (renderedClassName) => {
				if (isInControl) return cx(textInputInControlClassName, renderedClassName);

				return textInputRecipe({
					className: renderedClassName,
					size: sizeProp ?? contextSize ?? 'medium',
				});
			})}
		/>
	);
}

/**
 * Visual chrome around a `TextInput` and its optional `TextInputPrefix` and `TextInputSuffix`. The
 * control owns the border, background, shadow, and rounding, and its parts are transparent flex
 * children whose position follows document order.
 *
 * The control has no invalid prop. It reads invalid state from the input inside it and takes a
 * danger border. Pair an invalid control with an error message.
 */
export function TextInputControl(props: TextInputControlProps): JSX.Element {
	const { className, size: sizeProp, ...groupProps } = props;
	const size = sizeProp ?? use(TextInputSizeContext) ?? 'medium';

	return (
		<TextInputControlContext.Provider value>
			<TextInputSizeContext.Provider value={size}>
				{/*
				 * The provider covers the whole control, so an icon in a prefix or suffix stays
				 * proportioned to the control without a `size` of its own. Same precedent as `Button`
				 * (`BUTTON_ICON_SIZE`) and the combobox control.
				 */}
				<IconSizeProvider size={FIELD_CONTROL_ICON_SIZE[size]}>
					<RacGroup
						{...groupProps}
						className={composeRenderProps(className, (value) => {
							return textInputPartsRecipe({ size }).control({ className: value });
						})}
					/>
				</IconSizeProvider>
			</TextInputSizeContext.Provider>
		</TextInputControlContext.Provider>
	);
}

/** Content shown at the leading end of a `TextInputControl`, such as a currency symbol. */
export function TextInputPrefix(props: TextInputPrefixProps): JSX.Element {
	const { className, ...spanProps } = props;
	const size = use(TextInputSizeContext) ?? 'medium';

	return <span {...spanProps} className={textInputPartsRecipe({ size }).prefix({ className })} />;
}

/** Content shown at the trailing end of a `TextInputControl`, such as a unit or a button. */
export function TextInputSuffix(props: TextInputSuffixProps): JSX.Element {
	const { className, ...spanProps } = props;
	const size = use(TextInputSizeContext) ?? 'medium';

	return <span {...spanProps} className={textInputPartsRecipe({ size }).suffix({ className })} />;
}
