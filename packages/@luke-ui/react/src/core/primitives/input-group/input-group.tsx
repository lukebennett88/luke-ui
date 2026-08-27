import type { ComponentProps, JSX, Ref } from 'react';
import { createContext, use } from 'react';
import type { GroupProps as RacGroupProps } from 'react-aria-components/Group';
import { Group as RacGroup } from 'react-aria-components/Group';
import type { InputProps as RacInputProps } from 'react-aria-components/Input';
import { Input as RacInput } from 'react-aria-components/Input';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { IconSizeProvider } from '../../icon/icon-size-context.js';
import { Icon } from '../../icon/icon.js';
import { FIELD_CONTROL_ICON_SIZE } from '../../sizing/control-size.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import type { InputGroupSize } from './recipe.css.js';
import { inputGroupRecipe } from './recipe.css.js';

const InputGroupSizeContext = createContext<InputGroupSize | null>(null);

/**
 * Resolves a part's own `size` against the enclosing `InputGroup`, so a composition
 * sets the size once on the group. Mirrors `useComboboxSize`
 * (`primitives/combobox/size-context.tsx`).
 */
function useInputGroupSize(size?: InputGroupSize): InputGroupSize {
	return size ?? use(InputGroupSizeContext) ?? 'medium';
}

interface InputGroupPartStyleProps {
	/**
	 * Overrides the size inherited from the enclosing `InputGroup`.
	 * @default 'medium'
	 */
	size?: InputGroupSize;
}

type _InputGroupOmit = DistributiveOmit<RacGroupProps, 'children' | 'className'>;

interface _InputGroupProps extends _InputGroupOmit {
	/** The group's parts. Position follows document order. */
	children?: RacGroupProps['children'];
	/** Class name for the group element. */
	className?: RacGroupProps['className'];
	/** Whether the control is invalid. Inherited from an enclosing field when omitted. */
	isInvalid?: RacGroupProps['isInvalid'];
	/**
	 * Sets the control size. Nested parts inherit it.
	 * @default 'medium'
	 */
	size?: InputGroupSize;
}

/** Props for the input group root. */
export type InputGroupProps = Prettify<_InputGroupProps>;

type _InputGroupInputOmit = DistributiveOmit<RacInputProps, 'className' | 'size'>;

interface _InputGroupInputProps extends _InputGroupInputOmit, InputGroupPartStyleProps {
	/** Class name for the input element. */
	className?: RacInputProps['className'];
	/**
	 * Forwarded to the underlying `<input>` element. Accepts a callback ref or a ref
	 * object, so form libraries that hand out callback refs work without a bridge.
	 */
	ref?: Ref<HTMLInputElement>;
}

/** Props for the input group's editable control. */
export type InputGroupInputProps = Prettify<_InputGroupInputProps>;

type _InputGroupPrefixOmit = DistributiveOmit<ComponentProps<'span'>, never>;

interface _InputGroupPrefixProps extends _InputGroupPrefixOmit, InputGroupPartStyleProps {}

/** Props for the input group's leading part. */
export type InputGroupPrefixProps = Prettify<_InputGroupPrefixProps>;

type _InputGroupSuffixOmit = DistributiveOmit<ComponentProps<'span'>, never>;

interface _InputGroupSuffixProps extends _InputGroupSuffixOmit, InputGroupPartStyleProps {}

/** Props for the input group's trailing part. */
export type InputGroupSuffixProps = Prettify<_InputGroupSuffixProps>;

/**
 * Composable text-input control. The group owns the border, background, shadow, and
 * rounding; its parts are transparent flex children whose position follows document
 * order.
 *
 * ```tsx
 * <InputGroup>
 * 	<InputGroupPrefix>$</InputGroupPrefix>
 * 	<InputGroupInput inputMode="decimal" />
 * 	<InputGroupSuffix>USD</InputGroupSuffix>
 * </InputGroup>
 * ```
 *
 * This primitive is child-composed. `TextField` keeps its own `prefix` / `suffix` props and maps
 * them onto `InputGroupPrefix` / `InputGroupSuffix` internally.
 *
 * Invalid state arrives from the enclosing field's `GroupContext` or from an explicit
 * `isInvalid`, and surfaces as `[data-invalid]` on the group. The group renders its own
 * error icon whenever it is invalid, so a consumer cannot compose an invalid control
 * that carries no non-colour cue. The icon is `aria-hidden`: the field's error message
 * carries the meaning.
 */
export function InputGroup(props: InputGroupProps): JSX.Element {
	const { children, className, size = 'medium', ...groupProps } = props;
	const slots = inputGroupRecipe({ size });

	return (
		<InputGroupSizeContext.Provider value={size}>
			{/*
			 * The provider covers the whole group, not only the indicator below: it sizes
			 * the group's own error icon *and* any icon a caller puts in a prefix or
			 * suffix, so both stay proportioned to the control. Same precedent as
			 * `Button` (`BUTTON_ICON_SIZE`) and the field controls (`FIELD_CONTROL_ICON_SIZE`).
			 */}
			<IconSizeProvider size={FIELD_CONTROL_ICON_SIZE[size]}>
				<RacGroup
					{...groupProps}
					className={composeRenderProps(className, (value) => {
						return slots.group(value);
					})}
				>
					{composeRenderProps(children, (renderedChildren, { isInvalid }) => {
						return (
							<>
								{renderedChildren}
								{isInvalid ? (
									<Icon
										aria-hidden
										className={slots.invalidIndicator()}
										name="exclamationTriangle"
									/>
								) : null}
							</>
						);
					})}
				</RacGroup>
			</IconSizeProvider>
		</InputGroupSizeContext.Provider>
	);
}

/** The editable control inside an `InputGroup`. */
export function InputGroupInput(props: InputGroupInputProps): JSX.Element {
	const { className, size: sizeProp, ...inputProps } = props;
	const size = useInputGroupSize(sizeProp);

	return (
		<RacInput
			{...inputProps}
			className={composeRenderProps(className, (value) => {
				return inputGroupRecipe({ size }).control(value);
			})}
		/>
	);
}

/** Content shown at the leading end of an `InputGroup`, such as a currency symbol. */
export function InputGroupPrefix(props: InputGroupPrefixProps): JSX.Element {
	const { className, size: sizeProp, ...spanProps } = props;
	const size = useInputGroupSize(sizeProp);

	return <span {...spanProps} className={inputGroupRecipe({ size }).prefix(className)} />;
}

/**
 * Content shown at the trailing end of an `InputGroup`, such as a unit or a button. It
 * always follows the group's own invalid indicator, whatever its document position.
 */
export function InputGroupSuffix(props: InputGroupSuffixProps): JSX.Element {
	const { className, size: sizeProp, ...spanProps } = props;
	const size = useInputGroupSize(sizeProp);

	return <span {...spanProps} className={inputGroupRecipe({ size }).suffix(className)} />;
}
