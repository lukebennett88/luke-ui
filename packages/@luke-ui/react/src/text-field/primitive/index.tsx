import type { ComponentProps, JSX } from 'react';
import { createContext, use } from 'react';
import type { GroupProps as RacGroupProps } from 'react-aria-components/Group';
import { Group as RacGroup } from 'react-aria-components/Group';
import type { InputProps as RacInputProps } from 'react-aria-components/Input';
import { Input as RacInput } from 'react-aria-components/Input';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { IconSizeProvider } from '../../icon-size-context/index.js';
import { Icon } from '../../icon/index.js';
import * as styles from '../../recipes/text-input.css.js';
import { INPUT_GROUP_ICON_SIZE } from '../../sizing/input-group-sizing.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';

/** Allowed `size` values for `InputGroup` and its parts. */
export type InputGroupSize = styles.TextInputSize;

const InputGroupSizeContext = createContext<InputGroupSize | null>(null);

/**
 * Resolves a part's own `size` against the enclosing `InputGroup`, so a composition
 * sets the size once on the group. Mirrors `useComboboxSize`
 * (`combobox-field/primitive/size-context.tsx`).
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

/**
 * Props for the input group root.
 *
 * @tier primitive
 */
export type InputGroupProps = Prettify<_InputGroupProps>;

type _InputGroupInputOmit = DistributiveOmit<RacInputProps, 'className' | 'size'>;

interface _InputGroupInputProps extends _InputGroupInputOmit, InputGroupPartStyleProps {
	/** Class name for the input element. */
	className?: RacInputProps['className'];
}

/**
 * Props for the input group's editable control.
 *
 * @tier primitive
 */
export type InputGroupInputProps = Prettify<_InputGroupInputProps>;

type _InputGroupPrefixOmit = DistributiveOmit<ComponentProps<'span'>, never>;

interface _InputGroupPrefixProps extends _InputGroupPrefixOmit, InputGroupPartStyleProps {}

/**
 * Props for the input group's leading part.
 *
 * @tier primitive
 */
export type InputGroupPrefixProps = Prettify<_InputGroupPrefixProps>;

type _InputGroupSuffixOmit = DistributiveOmit<ComponentProps<'span'>, never>;

interface _InputGroupSuffixProps extends _InputGroupSuffixOmit, InputGroupPartStyleProps {}

/**
 * Props for the input group's trailing part.
 *
 * @tier primitive
 */
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
 * The two tiers deliberately speak different languages, and that is a decision rather
 * than an oversight. This primitive follows HeroUI's `InputGroup` child-composition
 * pattern, while the composed `TextField` above it keeps its Spectrum-style
 * `adornmentStart` / `adornmentEnd` props and maps them onto `InputGroupPrefix` /
 * `InputGroupSuffix` internally. Library authors compose; app developers pass props.
 *
 * Invalid state arrives from the enclosing field (React Aria's `GroupContext`) or from
 * an explicit `isInvalid`, and surfaces as `[data-invalid]` on the group. The group
 * renders its own error icon whenever it is invalid, so a consumer cannot compose an
 * invalid control that carries no non-colour cue (#247). The icon is `aria-hidden`:
 * the field's error message carries the meaning.
 */
export function InputGroup(props: InputGroupProps): JSX.Element {
	const { children, className, size = 'medium', ...groupProps } = props;
	const slots = styles.textInput({ size });

	return (
		<InputGroupSizeContext.Provider value={size}>
			{/*
			 * The provider covers the whole group, not only the indicator below: it sizes
			 * the group's own error icon *and* any icon a caller puts in a prefix or
			 * suffix, so both stay proportioned to the control. Same precedent as
			 * `Button` (`BUTTON_ICON_SIZE`) and `ComboboxTrigger` (`COMBOBOX_ICON_SIZE`).
			 */}
			<IconSizeProvider size={INPUT_GROUP_ICON_SIZE[size]}>
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
				return styles.textInput({ size }).control(value);
			})}
		/>
	);
}

/** Content shown at the leading end of an `InputGroup`, such as a currency symbol. */
export function InputGroupPrefix(props: InputGroupPrefixProps): JSX.Element {
	const { className, size: sizeProp, ...spanProps } = props;
	const size = useInputGroupSize(sizeProp);

	return <span {...spanProps} className={styles.textInput({ size }).prefix(className)} />;
}

/**
 * Content shown at the trailing end of an `InputGroup`, such as a unit or a button. It
 * always follows the group's own invalid indicator, whatever its document position.
 */
export function InputGroupSuffix(props: InputGroupSuffixProps): JSX.Element {
	const { className, size: sizeProp, ...spanProps } = props;
	const size = useInputGroupSize(sizeProp);

	return <span {...spanProps} className={styles.textInput({ size }).suffix(className)} />;
}
